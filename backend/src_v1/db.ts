import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { config } from './config';

const resolvedPath = path.resolve(config.dbPath);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

export const db = new sqlite3.Database(resolvedPath);

export function run(sql: string, params: unknown[] = []): Promise<{ changes: number; lastID: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes ?? 0, lastID: this.lastID ?? 0 });
    });
  });
}

export function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row as T | undefined);
    });
  });
}

export function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}

export function exec(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  await exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const result = await fn();
    await exec('COMMIT');
    return result;
  } catch (e) {
    await exec('ROLLBACK');
    throw e;
  }
}
