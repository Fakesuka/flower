import fs from 'fs';
import path from 'path';
import { all, exec, run } from './db';

export async function applyMigrations() {
  await exec(`
    CREATE TABLE IF NOT EXISTS applied_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationDir = path.resolve('backend/migrations');
  const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql')).sort();
  const applied = await all<{ name: string }>('SELECT name FROM applied_migrations');
  const appliedSet = new Set(applied.map((m) => m.name));

  for (const file of files) {
    if (appliedSet.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
    await exec(sql);
    await run('INSERT INTO applied_migrations(name) VALUES (?)', [file]);
  }
}
