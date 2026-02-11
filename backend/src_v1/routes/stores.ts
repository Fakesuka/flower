import { Router } from 'express';
import { all, get, run } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { storeSchema } from '../validation/schemas';
import { notFound } from '../lib/errors';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const stores = await all('SELECT * FROM stores ORDER BY id');
    res.json({ success: true, data: stores });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireRole('admin'), validateBody(storeSchema), async (req, res, next) => {
  try {
    const { name, address, is_active = true } = req.body;
    const result = await run('INSERT INTO stores(name, address, is_active) VALUES (?,?,?)', [name, address ?? null, is_active ? 1 : 0]);
    const store = await get('SELECT * FROM stores WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: store });
  } catch (e) { next(e); }
});

router.put('/:id', requireAuth, requireRole('admin'), validateBody(storeSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, address, is_active = true } = req.body;
    const r = await run('UPDATE stores SET name=?, address=?, is_active=? WHERE id=?', [name, address ?? null, is_active ? 1 : 0, id]);
    if (!r.changes) throw notFound('Store not found');
    const store = await get('SELECT * FROM stores WHERE id = ?', [id]);
    res.json({ success: true, data: store });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const r = await run('DELETE FROM stores WHERE id = ?', [id]);
    if (!r.changes) throw notFound('Store not found');
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
