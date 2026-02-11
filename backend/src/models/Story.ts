import { getDatabase } from '../database/db';

export interface Story {
  id: string;
  image: string;
  title: string;
  is_new: number;
  created_at: string;
}

export class StoryModel {
  static getAll(): Promise<Story[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM stories ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Story[]);
        }
      );
    });
  }

  static getById(id: string): Promise<Story | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM stories WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as Story || null);
        }
      );
    });
  }

  static create(story: Omit<Story, 'created_at'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(
        'INSERT INTO stories (id, image, title, is_new) VALUES (?, ?, ?, ?)',
        [story.id, story.image, story.title, story.is_new],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  static update(id: string, story: Partial<Story>): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(story).forEach(([key, value]) => {
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
        `UPDATE stories SET ${fields.join(', ')} WHERE id = ?`,
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
        'DELETE FROM stories WHERE id = ?',
        [id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
