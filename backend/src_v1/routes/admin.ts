import { Router } from 'express';
import { all } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/stats', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const byDay = await all(
      `SELECT date(created_at) as day, COUNT(*) as orders_count, SUM(total_price) as total_sum
       FROM orders
       GROUP BY date(created_at)
       ORDER BY day DESC`
    );

    const byStatus = await all(
      `SELECT status, COUNT(*) as orders_count
       FROM orders
       GROUP BY status
       ORDER BY orders_count DESC`
    );

    const byStore = await all(
      `SELECT assigned_store_id, COUNT(*) as orders_count
       FROM orders
       GROUP BY assigned_store_id
       ORDER BY orders_count DESC`
    );

    const revenue = await all(
      `SELECT date(created_at) as day, SUM(total_price) as revenue
       FROM orders
       WHERE status IN ('PAID','COMPLETED')
       GROUP BY date(created_at)
       ORDER BY day DESC`
    );

    res.json({ success: true, data: { byDay, byStatus, byStore, revenue } });
  } catch (e) { next(e); }
});

export default router;
