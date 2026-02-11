import { getDatabase } from '../database/db';

export interface DiscountCard {
  id: string;
  user_id: number;
  card_number: string;
  discount_percent: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
}

export class DiscountCardModel {
  static getByUserId(userId: number): Promise<DiscountCard | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM discount_cards WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as DiscountCard || null);
        }
      );
    });
  }

  static getPending(): Promise<DiscountCard[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        `SELECT dc.*, u.telegram_id, u.first_name, u.last_name, u.username 
         FROM discount_cards dc 
         JOIN users u ON dc.user_id = u.id 
         WHERE dc.status = 'pending' 
         ORDER BY dc.created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as DiscountCard[]);
        }
      );
    });
  }

  static getAll(): Promise<DiscountCard[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        `SELECT dc.*, u.telegram_id, u.first_name, u.last_name, u.username 
         FROM discount_cards dc 
         JOIN users u ON dc.user_id = u.id 
         ORDER BY dc.created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as DiscountCard[]);
        }
      );
    });
  }

  static create(card: Omit<DiscountCard, 'created_at'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'INSERT INTO discount_cards (id, user_id, card_number, discount_percent, status) VALUES (?, ?, ?, ?, ?)',
        [card.id, card.user_id, card.card_number, card.discount_percent, card.status],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static approve(id: string, discountPercent: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        `UPDATE discount_cards 
         SET status = 'approved', discount_percent = ?, approved_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [discountPercent, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static reject(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        "UPDATE discount_cards SET status = 'rejected' WHERE id = ?",
        [id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'DELETE FROM discount_cards WHERE id = ?',
        [id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static findByCardNumber(cardNumber: string): Promise<DiscountCard | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM discount_cards WHERE card_number = ?',
        [cardNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as DiscountCard || null);
        }
      );
    });
  }
}
