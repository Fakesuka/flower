import { getDatabase } from '../database/db';

export interface User {
  id: number;
  telegram_id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export class UserModel {
  static findByTelegramId(telegramId: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM users WHERE telegram_id = ?',
        [telegramId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as User || null);
        }
      );
    });
  }

  static getByTelegramId(telegramId: string): Promise<User | null> {
    return this.findByTelegramId(telegramId);
  }

  static getById(id: number): Promise<User | null> {
    return this.findById(id);
  }

  static create(userData: {
    telegram_id: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  }): Promise<User> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        `INSERT INTO users (telegram_id, first_name, last_name, username) 
         VALUES (?, ?, ?, ?)`,
        [userData.telegram_id, userData.first_name, userData.last_name, userData.username],
        function(err) {
          if (err) reject(err);
          else {
            UserModel.findById(this.lastID).then(resolve).catch(reject);
          }
        }
      );
    });
  }

  static findById(id: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as User || null);
        }
      );
    });
  }

  static updatePhone(userId: number, phone: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [phone, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static update(userId: number, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      
      if (fields.length === 0) {
        resolve();
        return;
      }
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      db.run(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static getOrCreate(telegramData: {
    telegram_id: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  }): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await UserModel.findByTelegramId(telegramData.telegram_id);
        if (!user) {
          user = await UserModel.create(telegramData);
        }
        resolve(user);
      } catch (err) {
        reject(err);
      }
    });
  }
}
