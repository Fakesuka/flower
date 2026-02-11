import { getDatabase } from '../database/db';

export interface Order {
  id: string;
  user_id: number;
  status: 'pending' | 'accepted' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  total: number;
  subtotal: number;
  delivery_cost: number;
  discount_amount: number;
  discount_card_id?: string;
  delivery_date?: string;
  delivery_time?: string;
  address: string;
  recipient: string;
  payment_method: string;
  items: string;
  store_location: 'cvetochaya_lavka' | 'florenciya';
  florist_notified: number;
  customer_notified: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_url?: string;
  florist_chat_id?: string;
  created_at: string;
}

export class OrderModel {
  static getByUserId(userId: number): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Order[]);
        }
      );
    });
  }

  static getById(id: string): Promise<Order | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM orders WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Order || null);
        }
      );
    });
  }

  static create(order: Omit<Order, 'created_at'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        `INSERT INTO orders (id, user_id, status, total, subtotal, delivery_cost, 
         discount_amount, discount_card_id, delivery_date, delivery_time, address, 
         recipient, payment_method, items, store_location, payment_status, payment_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.user_id,
          order.status,
          order.total,
          order.subtotal,
          order.delivery_cost,
          order.discount_amount,
          order.discount_card_id || null,
          order.delivery_date || null,
          order.delivery_time || null,
          order.address,
          order.recipient,
          order.payment_method,
          order.items,
          order.store_location || 'cvetochaya_lavka',
          order.payment_status || 'pending',
          order.payment_url || null
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static updateStatus(id: string, status: Order['status']): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static getAll(): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        `SELECT o.*, u.telegram_id, u.first_name, u.last_name, u.username 
         FROM orders o 
         JOIN users u ON o.user_id = u.id 
         ORDER BY o.created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Order[]);
        }
      );
    });
  }

  static getPending(): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        `SELECT o.*, u.telegram_id, u.first_name, u.last_name, u.username 
         FROM orders o 
         JOIN users u ON o.user_id = u.id 
         WHERE o.status IN ('pending', 'accepted', 'preparing', 'delivering')
         ORDER BY o.created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Order[]);
        }
      );
    });
  }

  static updateFloristNotified(id: string, notified: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'UPDATE orders SET florist_notified = ? WHERE id = ?',
        [notified ? 1 : 0, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static updateCustomerNotified(id: string, notified: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'UPDATE orders SET customer_notified = ? WHERE id = ?',
        [notified ? 1 : 0, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static updateFloristChatId(id: string, chatId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'UPDATE orders SET florist_chat_id = ? WHERE id = ?',
        [chatId, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static updatePaymentStatus(id: string, status: Order['payment_status']): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'UPDATE orders SET payment_status = ? WHERE id = ?',
        [status, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static updatePaymentUrl(id: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'UPDATE orders SET payment_url = ? WHERE id = ?',
        [url, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
