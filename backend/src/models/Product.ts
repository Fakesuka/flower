import { getDatabase } from '../database/db';

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image: string;
  images?: string;
  category_id: string;
  description: string;
  composition?: string;
  sizes?: string;
  colors?: string;
  is_new: number;
  is_bestseller: number;
  created_at: string;
}

export class ProductModel {
  static getAll(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM products ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Product[]);
        }
      );
    });
  }

  static getByCategory(categoryId: string): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM products WHERE category_id = ? ORDER BY created_at DESC',
        [categoryId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Product[]);
        }
      );
    });
  }

  static getById(id: string): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM products WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Product || null);
        }
      );
    });
  }

  static create(product: Omit<Product, 'created_at'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        `INSERT INTO products (id, name, price, original_price, image, images, category_id, 
         description, composition, sizes, colors, is_new, is_bestseller) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.name,
          product.price,
          product.original_price || null,
          product.image,
          product.images || null,
          product.category_id,
          product.description,
          product.composition || null,
          product.sizes || null,
          product.colors || null,
          product.is_new,
          product.is_bestseller
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static update(id: string, product: Partial<Product>): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(product).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'created_at') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length === 0) {
        resolve();
        return;
      }

      values.push(id);

      db.run(
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        values,
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
        'DELETE FROM products WHERE id = ?',
        [id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static getBestsellers(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM products WHERE is_bestseller = 1 ORDER BY created_at DESC LIMIT 10',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Product[]);
        }
      );
    });
  }

  static getNew(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM products WHERE is_new = 1 ORDER BY created_at DESC LIMIT 10',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Product[]);
        }
      );
    });
  }

  static search(query: string): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const searchTerm = `%${query}%`;
      db.all(
        `SELECT * FROM products 
         WHERE name LIKE ? OR description LIKE ? 
         ORDER BY created_at DESC 
         LIMIT 20`,
        [searchTerm, searchTerm],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Product[]);
        }
      );
    });
  }
}
