import { Router } from 'express';
import { all, get, run, withTransaction } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createOrderSchema, eventSchema, updateStatusSchema } from '../validation/schemas';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors';
import type { OrderStatus } from '../types';
import { getPaymentProvider } from '../payments';

const router = Router();

function canFloristAccessOrder(userStoreId: number | null, order: any): boolean {
  if (!userStoreId) return false;
  return order.pickup_store_id === userStoreId || order.assigned_store_id === userStoreId;
}

async function getLatestPayment(orderId: number) {
  return get<any>('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', [orderId]);
}

router.post('/', validateBody(createOrderSchema), async (req, res, next) => {
  try {
    const payload = req.body;
    if (payload.delivery_type === 'pickup' && !payload.pickup_store_id) {
      throw badRequest('pickup_store_id is required for pickup orders');
    }
    const assignedStoreId = payload.delivery_type === 'pickup' ? payload.pickup_store_id : null;

    const result = await run(
      `INSERT INTO orders(
        delivery_type,pickup_store_id,assigned_store_id,status,customer_name,customer_phone,customer_comment,items_json,total_price
      ) VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        payload.delivery_type,
        payload.pickup_store_id ?? null,
        assignedStoreId ?? null,
        'NEW',
        payload.customer_name,
        payload.customer_phone,
        payload.customer_comment ?? null,
        JSON.stringify(payload.items),
        payload.total_price,
      ]
    );

    await run('INSERT INTO order_events(order_id, event_type, status_to, message) VALUES (?,?,?,?)', [result.lastID, 'STATUS_CHANGE', 'NEW', 'Order created']);

    const order = await get('SELECT * FROM orders WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
});

router.get('/', requireAuth, requireRole('admin', 'florist'), async (req, res, next) => {
  try {
    let sql = 'SELECT * FROM orders';
    const params: unknown[] = [];
    if (req.user!.role === 'florist') {
      sql += ' WHERE pickup_store_id = ? OR assigned_store_id = ? OR (delivery_type = "delivery" AND status = "NEW" AND assigned_store_id IS NULL)';
      params.push(req.user!.store_id, req.user!.store_id);
    }
    sql += ' ORDER BY id DESC';
    const orders = await all(sql, params);
    res.json({ success: true, data: orders });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/status', async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const order = await get<any>('SELECT id, status FROM orders WHERE id = ?', [orderId]);
    if (!order) throw notFound('Order not found');
    const payment = await getLatestPayment(orderId);
    res.json({ success: true, data: { id: order.id, status: order.status, payment_url: payment?.payment_url ?? null } });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/accept', requireAuth, requireRole('admin', 'florist'), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const order = await get<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) throw notFound('Order not found');

    const actorStoreId = req.user!.store_id;
    if (req.user!.role === 'florist' && !actorStoreId) throw forbidden('Florist must be assigned to a store');

    await withTransaction(async () => {
      if (order.delivery_type === 'pickup') {
        if (req.user!.role === 'florist' && actorStoreId !== order.pickup_store_id) {
          throw forbidden('Florist can accept pickup only for own store');
        }

        const assigned = order.pickup_store_id;
        const r = await run(
          `UPDATE orders
           SET assigned_store_id = ?, status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status = 'NEW' AND (assigned_store_id IS NULL OR assigned_store_id = ?)`,
          [assigned, orderId, assigned]
        );
        if (!r.changes) throw conflict('Order already accepted or not in NEW status');
      } else {
        const storeId = req.user!.role === 'admin' ? Number(req.body?.store_id || actorStoreId) : actorStoreId;
        if (!storeId) throw badRequest('store_id is required for admin accepting delivery order');

        const r = await run(
          `UPDATE orders
           SET assigned_store_id = ?, status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status = 'NEW' AND assigned_store_id IS NULL`,
          [storeId, orderId]
        );
        if (!r.changes) throw conflict('Order already accepted or not in NEW status');
      }

      await run(
        'INSERT INTO order_events(order_id, actor_user_id, event_type, status_from, status_to, message) VALUES (?,?,?,?,?,?)',
        [orderId, req.user!.id, 'STATUS_CHANGE', 'NEW', 'ACCEPTED', 'Order accepted']
      );
    });

    const updated = await get('SELECT * FROM orders WHERE id = ?', [orderId]);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/create-payment-link', requireAuth, requireRole('admin', 'florist'), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const order = await get<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) throw notFound('Order not found');

    if (req.user!.role === 'florist' && order.assigned_store_id !== req.user!.store_id) {
      throw forbidden('Florist can create payment link only for assigned order of own store');
    }

    if (order.status !== 'ACCEPTED') {
      throw conflict('Payment link can be created only for ACCEPTED order');
    }

    const existingPaid = await get<any>(
      "SELECT id FROM payments WHERE order_id = ? AND status = 'PAID' ORDER BY id DESC LIMIT 1",
      [orderId]
    );
    if (existingPaid) throw conflict('Order already paid');

    const provider = getPaymentProvider('mock', `${req.protocol}://${req.get('host')}`);

    const created = await withTransaction(async () => {
      const paymentInsert = await run(
        'INSERT INTO payments(order_id, provider, status, amount, currency) VALUES (?,?,?,?,?)',
        [orderId, provider.name, 'CREATED', order.total_price, 'RUB']
      );

      const generated = await provider.createPayment({
        paymentId: paymentInsert.lastID,
        orderId,
        amount: order.total_price,
        currency: 'RUB',
      });

      await run('UPDATE payments SET status = ?, payment_url = ?, external_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        generated.status,
        generated.paymentUrl,
        generated.externalId,
        paymentInsert.lastID,
      ]);

      await run("UPDATE orders SET status = 'PAYMENT_LINK_SENT', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [orderId]);

      await run(
        'INSERT INTO order_events(order_id, actor_user_id, event_type, status_from, status_to, message) VALUES (?,?,?,?,?,?)',
        [orderId, req.user!.id, 'PAYMENT_LINK_CREATED', 'ACCEPTED', 'PAYMENT_LINK_SENT', 'Payment link generated']
      );

      return get<any>('SELECT * FROM payments WHERE id = ?', [paymentInsert.lastID]);
    });

    res.json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/status', requireAuth, requireRole('admin', 'florist'), validateBody(updateStatusSchema), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const order = await get<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) throw notFound('Order not found');

    if (req.user!.role === 'florist' && !canFloristAccessOrder(req.user!.store_id, order)) {
      throw forbidden('Florist cannot modify this order');
    }

    const nextStatus = req.body.status as OrderStatus;
    if (nextStatus === 'IN_PROGRESS' && order.status !== 'PAID') {
      throw conflict('Cannot start progress before payment (PAID)');
    }

    await run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextStatus, orderId]);
    await run(
      'INSERT INTO order_events(order_id, actor_user_id, event_type, status_from, status_to, message) VALUES (?,?,?,?,?,?)',
      [orderId, req.user!.id, 'STATUS_CHANGE', order.status, nextStatus, req.body.message ?? null]
    );

    const updated = await get('SELECT * FROM orders WHERE id = ?', [orderId]);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/events', requireAuth, requireRole('admin', 'florist'), validateBody(eventSchema), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const order = await get<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) throw notFound('Order not found');

    if (req.user!.role === 'florist' && !canFloristAccessOrder(req.user!.store_id, order)) {
      throw forbidden('Florist cannot add event to this order');
    }

    const result = await run('INSERT INTO order_events(order_id, actor_user_id, event_type, message) VALUES (?,?,?,?)', [
      orderId,
      req.user!.id,
      req.body.event_type,
      req.body.message,
    ]);

    const event = await get('SELECT * FROM order_events WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: event });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/events', requireAuth, requireRole('admin', 'florist'), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const order = await get<any>('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) throw notFound('Order not found');
    if (req.user!.role === 'florist' && !canFloristAccessOrder(req.user!.store_id, order)) {
      throw forbidden('Florist cannot view this order events');
    }
    const events = await all('SELECT * FROM order_events WHERE order_id = ? ORDER BY id ASC', [orderId]);
    res.json({ success: true, data: events });
  } catch (e) {
    next(e);
  }
});

export default router;
