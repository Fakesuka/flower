import { Router } from 'express';
import { all, get, run } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { storySchema } from '../validation/schemas';
import { notFound } from '../lib/errors';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const stories = await all('SELECT * FROM stories ORDER BY id DESC');
    res.json({ success: true, data: stories });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireRole('admin', 'florist'), validateBody(storySchema), async (req, res, next) => {
  try {
    const { title, image, is_active = true } = req.body;
    const result = await run('INSERT INTO stories(title, image, is_active) VALUES (?,?,?)', [title, image ?? null, is_active ? 1 : 0]);
    const story = await get('SELECT * FROM stories WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: story });
  } catch (e) { next(e); }
});

router.put('/:id', requireAuth, requireRole('admin', 'florist'), validateBody(storySchema.partial()), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const current = await get<any>('SELECT * FROM stories WHERE id = ?', [id]);
    if (!current) throw notFound('Story not found');
    const nextData = { ...current, ...req.body };
    await run('UPDATE stories SET title=?, image=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [nextData.title, nextData.image, nextData.is_active ? 1 : 0, id]);
    const story = await get('SELECT * FROM stories WHERE id = ?', [id]);
    res.json({ success: true, data: story });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole('admin', 'florist'), async (req, res, next) => {
  try {
    const r = await run('DELETE FROM stories WHERE id = ?', [Number(req.params.id)]);
    if (!r.changes) throw notFound('Story not found');
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
