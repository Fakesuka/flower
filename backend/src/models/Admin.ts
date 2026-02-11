import { getDatabase } from '../database/db';

export interface Admin {
  id: number;
  telegram_id: string;
  name?: string;
  role: 'admin' | 'florist';
  created_at: string;
}

export class AdminModel {
  static async findByTelegramId(telegramId: string): Promise<Admin | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM admins WHERE telegram_id = ?',
        [telegramId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Admin || null);
        }
      );
    });
  }

  static async isAdmin(telegramId: string): Promise<boolean> {
    const admin = await this.findByTelegramId(telegramId);
    return !!admin;
  }

  static async getAll(): Promise<Admin[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM admins ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Admin[]);
        }
      );
    });
  }

  static async create(telegramId: string, name?: string, role: 'admin' | 'florist' = 'florist'): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'INSERT INTO admins (telegram_id, name, role) VALUES (?, ?, ?)',
        [telegramId, name || null, role],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async delete(telegramId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'DELETE FROM admins WHERE telegram_id = ?',
        [telegramId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static async updateRole(telegramId: string, role: 'admin' | 'florist'): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'UPDATE admins SET role = ? WHERE telegram_id = ?',
        [role, telegramId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
