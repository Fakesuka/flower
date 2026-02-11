import { get, run, withTransaction } from '../db';
import { conflict, notFound } from '../lib/errors';

export async function markPaymentAsPaid(paymentId: number, eventMessage = 'Payment completed') {
  await withTransaction(async () => {
    const payment = await get<any>('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payment) throw notFound('Payment not found');
    if (payment.status === 'PAID') throw conflict('Payment already paid');

    await run('UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['PAID', paymentId]);
    await run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['PAID', payment.order_id]);

    await run(
      'INSERT INTO order_events(order_id, event_type, status_from, status_to, message) VALUES (?,?,?,?,?)',
      [payment.order_id, 'PAYMENT_PAID', 'PAYMENT_LINK_SENT', 'PAID', eventMessage]
    );
  });
}
