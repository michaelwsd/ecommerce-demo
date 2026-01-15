import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'store.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Verified devices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS verified_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Pending verifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      code TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inquiries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Owner messages/inbox table
  db.exec(`
    CREATE TABLE IF NOT EXISTS owner_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Product operations
export function getAllProducts() {
  const db = getDb();
  return db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
}

export function getProductById(id: number) {
  const db = getDb();
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

export function createProduct(name: string, description: string, price: number, imagePath: string | null) {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO products (name, description, price, image_path) VALUES (?, ?, ?, ?)');
  return stmt.run(name, description, price, imagePath);
}

export function deleteProduct(id: number) {
  const db = getDb();
  return db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

// Device verification operations
export function isDeviceVerified(deviceId: string) {
  const db = getDb();
  const device = db.prepare('SELECT * FROM verified_devices WHERE device_id = ?').get(deviceId);
  return !!device;
}

export function getVerifiedDevice(deviceId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM verified_devices WHERE device_id = ?').get(deviceId);
}

export function createPendingVerification(deviceId: string, code: string) {
  const db = getDb();
  // Delete any existing pending verification for this device
  db.prepare('DELETE FROM pending_verifications WHERE device_id = ?').run(deviceId);
  const stmt = db.prepare('INSERT INTO pending_verifications (device_id, code) VALUES (?, ?)');
  return stmt.run(deviceId, code);
}

export function verifyCode(deviceId: string, code: string) {
  const db = getDb();
  const pending = db.prepare('SELECT * FROM pending_verifications WHERE device_id = ? AND code = ?').get(deviceId, code);
  return !!pending;
}

export function completeVerification(deviceId: string, name: string, phone: string) {
  const db = getDb();
  // Delete pending verification
  db.prepare('DELETE FROM pending_verifications WHERE device_id = ?').run(deviceId);
  // Create verified device
  const stmt = db.prepare('INSERT OR REPLACE INTO verified_devices (device_id, name, phone) VALUES (?, ?, ?)');
  return stmt.run(deviceId, name, phone);
}

// Inquiry operations
export function createInquiry(customerName: string, customerPhone: string, productName: string, productId: number) {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO inquiries (customer_name, customer_phone, product_name, product_id) VALUES (?, ?, ?, ?)');
  return stmt.run(customerName, customerPhone, productName, productId);
}

export function getAllInquiries() {
  const db = getDb();
  return db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
}

// Owner message/inbox operations
export function createOwnerMessage(
  type: 'verification' | 'inquiry',
  title: string,
  content: string,
  metadata?: Record<string, unknown>
) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO owner_messages (type, title, content, metadata) VALUES (?, ?, ?, ?)'
  );
  return stmt.run(type, title, content, metadata ? JSON.stringify(metadata) : null);
}

export function getAllOwnerMessages() {
  const db = getDb();
  return db.prepare('SELECT * FROM owner_messages ORDER BY created_at DESC').all();
}

export function getUnreadMessageCount() {
  const db = getDb();
  const result = db.prepare('SELECT COUNT(*) as count FROM owner_messages WHERE is_read = 0').get() as { count: number };
  return result.count;
}

export function markMessageAsRead(id: number) {
  const db = getDb();
  return db.prepare('UPDATE owner_messages SET is_read = 1 WHERE id = ?').run(id);
}

export function markAllMessagesAsRead() {
  const db = getDb();
  return db.prepare('UPDATE owner_messages SET is_read = 1').run();
}

export function deleteOwnerMessage(id: number) {
  const db = getDb();
  return db.prepare('DELETE FROM owner_messages WHERE id = ?').run(id);
}
