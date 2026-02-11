import { getDatabase } from '../database/db';

export interface Favorite {
  id: number;
  user_id: number;
  product_id: string;
  created_at: string;
}

export class FavoriteModel {
  static getByUserId(userId: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT product_id FROM favorites WHERE user_id = ?',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve((rows as Favorite[]).map(r => r.product_id));
        }
      );
    });
  }

  static add(userId: number, productId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)',
        [userId, productId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static remove(userId: number, productId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
        [userId, productId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static isFavorite(userId: number, productId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?',
        [userId, productId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }
}
