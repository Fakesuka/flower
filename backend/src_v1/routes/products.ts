import { Router } from 'express';
import { all, get, run } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { productSchema } from '../validation/schemas';
import { notFound } from '../lib/errors';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const products = await all('SELECT * FROM products ORDER BY id DESC');
    res.json({ success: true, data: products });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireRole('admin', 'florist'), validateBody(productSchema), async (req, res, next) => {
  try {
    const { name, description, price, image, is_active = true } = req.body;
    const result = await run(
      'INSERT INTO products(name, description, price, image, is_active) VALUES (?,?,?,?,?)',
      [name, description ?? null, price, image ?? null, is_active ? 1 : 0]
    );
    const product = await get('SELECT * FROM products WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: product });
  } catch (e) { next(e); }
});

router.put('/:id', requireAuth, requireRole('admin', 'florist'), validateBody(productSchema.partial()), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const current = await get<any>('SELECT * FROM products WHERE id = ?', [id]);
    if (!current) throw notFound('Product not found');
    const nextData = { ...current, ...req.body };
    await run(
      'UPDATE products SET name=?, description=?, price=?, image=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [nextData.name, nextData.description, nextData.price, nextData.image, nextData.is_active ? 1 : 0, id]
    );
    const product = await get('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ success: true, data: product });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, requireRole('admin', 'florist'), async (req, res, next) => {
  try {
    const r = await run('DELETE FROM products WHERE id = ?', [Number(req.params.id)]);
    if (!r.changes) throw notFound('Product not found');
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
