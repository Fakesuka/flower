import { NextFunction, Request, Response } from 'express';
import { unauthorized, forbidden } from '../lib/errors';
import { verifyToken } from '../lib/jwt';
import type { AuthUser, Role } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw unauthorized();
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    next(unauthorized());
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}
