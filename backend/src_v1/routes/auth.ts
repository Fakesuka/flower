import { Router } from 'express';
import { get } from '../db';
import { verifyPassword } from '../lib/password';
import { signToken } from '../lib/jwt';
import { unauthorized } from '../lib/errors';
import { validateBody } from '../middleware/validate';
import { loginSchema } from '../validation/schemas';

const router = Router();

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await get<{ id: number; username: string; password_hash: string; role: 'admin' | 'florist'; store_id: number | null }>(
      'SELECT id, username, password_hash, role, store_id FROM users WHERE username = ?',
      [username]
    );

    if (!user) throw unauthorized('Invalid credentials');
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) throw unauthorized('Invalid credentials');

    const token = signToken({ id: user.id, username: user.username, role: user.role, store_id: user.store_id });
    res.json({ success: true, data: { token, user: { id: user.id, username: user.username, role: user.role, store_id: user.store_id } } });
  } catch (e) {
    next(e);
  }
});

export default router;
