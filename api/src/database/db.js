import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const dbPath = join(__dirname, '../../database.db');
const db = new sqlite3.Database(dbPath);

// Promisify database methods
// Custom runAsync to return the statement object with changes
db.runAsync = function(...args) {
  return new Promise((resolve, reject) => {
    db.run(...args, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
db.execAsync = promisify(db.exec.bind(db));

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize schema
const initializeDatabase = async () => {
  try {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await db.execAsync(schema);
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

// Run initialization
await initializeDatabase();

export default db;
