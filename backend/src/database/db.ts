import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../../data/database.sqlite');

let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        initializeTables();
      }
    });
  }
  return db;
}

function initializeTables() {
  if (!db) return;

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // Products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      original_price INTEGER,
      image TEXT NOT NULL,
      images TEXT,
      category_id TEXT NOT NULL,
      description TEXT,
      composition TEXT,
      sizes TEXT,
      colors TEXT,
      is_new INTEGER DEFAULT 0,
      is_bestseller INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Stories table
  db.run(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      image TEXT NOT NULL,
      title TEXT NOT NULL,
      is_new INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Discount cards table
  db.run(`
    CREATE TABLE IF NOT EXISTS discount_cards (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      card_number TEXT NOT NULL,
      discount_percent INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Orders table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      total INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      delivery_cost INTEGER DEFAULT 0,
      discount_amount INTEGER DEFAULT 0,
      discount_card_id TEXT,
      delivery_date TEXT,
      delivery_time TEXT,
      address TEXT NOT NULL,
      recipient TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      items TEXT NOT NULL,
      store_location TEXT DEFAULT 'cvetochaya_lavka',
      florist_notified INTEGER DEFAULT 0,
      customer_notified INTEGER DEFAULT 0,
      payment_status TEXT DEFAULT 'pending',
      payment_url TEXT,
      florist_chat_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Favorites table
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Cart table (for persistent cart)
  db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      selected_size TEXT,
      selected_color TEXT,
      custom_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Addresses table
  db.run(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      city TEXT NOT NULL,
      street TEXT NOT NULL,
      house TEXT NOT NULL,
      apartment TEXT,
      entrance TEXT,
      floor TEXT,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Settings table (delivery prices, seasonal theme, etc.)
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admins table (for admin panel access)
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'florist',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default settings
  const defaultSettings = [
    { key: 'delivery_city_price', value: '500' },
    { key: 'delivery_outskirts_price', value: '800' },
    { key: 'free_delivery_threshold', value: '3000' },
    { key: 'seasonal_theme', value: 'spring' },
    { key: 'shop_name', value: 'Цветочная лавка' },
    { key: 'shop_phone', value: '+7 (999) 000-00-00' },
    { key: 'shop_address_cvetochaya', value: 'ул. Цветочная, 1' },
    { key: 'shop_address_florenciya', value: 'ул. Роз, 15' },
    { key: 'working_hours', value: '9:00 - 21:00' },
  ];

  defaultSettings.forEach(setting => {
    db!.run(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      [setting.key, setting.value]
    );
  });

  // Insert default categories
  const defaultCategories = [
    { id: 'bouquets', name: 'Букеты', icon: 'Flower2', sort: 1 },
    { id: 'potted', name: 'Горшечные растения', icon: 'Sprout', sort: 2 },
    { id: 'toys', name: 'Мягкие игрушки', icon: 'Heart', sort: 3 },
    { id: 'souvenirs', name: 'Сувениры', icon: 'Gift', sort: 4 },
    { id: 'balloons', name: 'Воздушные шары', icon: 'Circle', sort: 5 },
    { id: 'cards', name: 'Открытки', icon: 'Mail', sort: 6 },
    { id: 'garden', name: 'Садовые принадлежности', icon: 'Shovel', sort: 7 },
    { id: 'sweets', name: 'Сладости', icon: 'Candy', sort: 8 },
    { id: 'edible', name: 'Съедобные букеты', icon: 'Apple', sort: 9 },
    { id: 'compositions', name: 'Композиции', icon: 'LayoutGrid', sort: 10 },
  ];

  defaultCategories.forEach(cat => {
    db!.run(
      `INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)`,
      [cat.id, cat.name, cat.icon, cat.sort]
    );
  });

  console.log('Database tables initialized');
}

export function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
    db = null;
  }
}
