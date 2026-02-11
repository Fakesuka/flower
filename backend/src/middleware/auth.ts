import { Request, Response, NextFunction } from 'express';
import CryptoJS from 'crypto-js';
import { UserModel } from '../models/User';
import { AdminModel } from '../models/Admin';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        telegram_id: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        phone?: string;
      };
      userId?: number;
      telegramId?: string;
      telegramData?: {
        id: string;
        first_name?: string;
        last_name?: string;
        username?: string;
        auth_date: string;
        hash: string;
      };
    }
  }
}

const BOT_TOKEN = process.env.BOT_TOKEN || '';

/**
 * Verify Telegram WebApp initData
 * This validates that the request comes from a real Telegram WebApp
 */
export function verifyTelegramAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['x-telegram-auth'];
  
  if (!authHeader || typeof authHeader !== 'string') {
    // For development, allow requests without auth
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: skipping auth verification');
      req.telegramData = {
        id: '123456789',
        first_name: 'Test',
        username: 'testuser',
        auth_date: String(Math.floor(Date.now() / 1000)),
        hash: 'dev'
      };
      req.telegramId = '123456789';
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing auth header' });
  }

  try {
    // Parse initData from header
    const initData = new URLSearchParams(authHeader);
    const hash = initData.get('hash');
    
    if (!hash) {
      return res.status(401).json({ error: 'Unauthorized: Missing hash' });
    }

    // Remove hash from data_check_string
    initData.delete('hash');
    
    // Sort keys alphabetically
    const keys = Array.from(initData.keys()).sort();
    const dataCheckString = keys.map(key => `${key}=${initData.get(key)}`).join('\n');

    // Create secret key from bot token
    const secretKey = CryptoJS.HmacSHA256(BOT_TOKEN, 'WebAppData').toString();
    
    // Calculate hash
    const calculatedHash = CryptoJS.HmacSHA256(dataCheckString, secretKey).toString();

    // Verify hash
    if (calculatedHash !== hash) {
      return res.status(401).json({ error: 'Unauthorized: Invalid hash' });
    }

    // Check auth_date is not too old (max 24 hours)
    const authDate = parseInt(initData.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return res.status(401).json({ error: 'Unauthorized: Auth expired' });
    }

    // Parse user data
    const userData = JSON.parse(initData.get('user') || '{}');
    
    req.telegramData = {
      id: String(userData.id),
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      auth_date: String(authDate),
      hash
    };
    
    req.telegramId = String(userData.id);

    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid auth data' });
  }
}

/**
 * Load or create user from Telegram data
 */
export async function loadUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.telegramData) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await UserModel.getOrCreate({
      telegram_id: req.telegramData.id,
      first_name: req.telegramData.first_name,
      last_name: req.telegramData.last_name,
      username: req.telegramData.username
    });

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Load user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Combined auth middleware
 */
export const requireAuth = [verifyTelegramAuth, loadUser];

/**
 * Optional auth - loads user if available, but doesn't require it
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['x-telegram-auth'];
    
    if (!authHeader || typeof authHeader !== 'string') {
      return next();
    }

    const initData = new URLSearchParams(authHeader);
    const userData = JSON.parse(initData.get('user') || '{}');
    
    if (userData.id) {
      const user = await UserModel.findByTelegramId(String(userData.id));
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
}

/**
 * Require admin access
 * Must be used after requireAuth
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const isAdmin = await AdminModel.isAdmin(req.user.telegram_id);
    
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
