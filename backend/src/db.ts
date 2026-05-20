import Database, { Database as DB } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'shop.db');

const db: DB = new Database(dbPath);

export { db };

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      image_url TEXT,
      category TEXT,
      stock INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      telegram_user_id INTEGER NOT NULL,
      telegram_username TEXT,
      items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'pending',
      payment_id TEXT,
      payment_url TEXT,
      crypto_currency TEXT,
      paid_amount REAL,
      expires_at DATETIME,
      deposit_address TEXT,
      address_index INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      payload TEXT,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_telegram_user_id ON orders(telegram_user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);
    CREATE INDEX IF NOT EXISTS idx_orders_deposit_address ON orders(deposit_address);
  `);

  try {
    db.exec(`ALTER TABLE orders ADD COLUMN deposit_address TEXT`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE orders ADD COLUMN address_index INTEGER`);
  } catch (e) {
    // Column already exists
  }

  console.log('Database initialized');
}

export default db;
