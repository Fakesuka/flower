import { Router } from 'express';
import { all, get, run } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { userCreateSchema } from '../validation/schemas';
import { hashPassword } from '../lib/password';
import { conflict, notFound } from '../lib/errors';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const users = await all('SELECT id, username, role, store_id, created_at FROM users ORDER BY id');
    res.json({ success: true, data: users });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, requireRole('admin'), validateBody(userCreateSchema), async (req, res, next) => {
  try {
    const { username, password, role, store_id = null } = req.body;
    const exists = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (exists) throw conflict('Username already exists');

    const passwordHash = await hashPassword(password);
    const result = await run('INSERT INTO users(username, password_hash, role, store_id) VALUES (?,?,?,?)', [username, passwordHash, role, store_id]);
    const user = await get('SELECT id, username, role, store_id, created_at FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.put('/:id', requireAuth, requireRole('admin'), validateBody(userCreateSchema.partial()), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const current = await get<any>('SELECT * FROM users WHERE id = ?', [id]);
    if (!current) throw notFound('User not found');

    const username = req.body.username ?? current.username;
    const role = req.body.role ?? current.role;
    const storeId = req.body.store_id === undefined ? current.store_id : req.body.store_id;
    const passwordHash = req.body.password ? await hashPassword(req.body.password) : current.password_hash;

    await run('UPDATE users SET username=?, password_hash=?, role=?, store_id=? WHERE id=?', [username, passwordHash, role, storeId, id]);
    const user = await get('SELECT id, username, role, store_id, created_at FROM users WHERE id = ?', [id]);
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

export default router;
