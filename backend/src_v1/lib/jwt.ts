import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { AuthUser } from '../types';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, store_id: user.store_id },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, config.jwtSecret) as any;
  return {
    id: Number(payload.sub),
    username: payload.username,
    role: payload.role,
    store_id: payload.store_id ?? null,
  };
}
