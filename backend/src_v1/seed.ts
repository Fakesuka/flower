import { get } from './db';
import { run } from './db';
import { hashPassword } from './lib/password';

export async function ensureDefaultAdmin() {
  const username = process.env.DEFAULT_ADMIN_USERNAME;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!username || !password) return;

  const existing = await get<{ id: number }>('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) return;

  const hash = await hashPassword(password);
  await run('INSERT INTO users(username, password_hash, role, store_id) VALUES (?,?,?,NULL)', [username, hash, 'admin']);
}
