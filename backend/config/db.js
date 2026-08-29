require('dotenv').config();

const dbClient = (process.env.DB_CLIENT || 'sqlite').toLowerCase();

let db;

if (dbClient === 'mysql') {
  try {
    const mysql = require('mysql2');
    const isLocalhost = !process.env.DB_HOST || 
      process.env.DB_HOST === 'localhost' || 
      process.env.DB_HOST === '127.0.0.1';

    const shouldEnableSSL = process.env.DB_SSL === 'true' || 
      (!isLocalhost && process.env.DB_SSL !== 'false' && process.env.DB_HOST && !process.env.DB_HOST.includes('localhost'));

    const poolConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'placement_db',
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    if (shouldEnableSSL) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    const pool = mysql.createPool(poolConfig);
    db = pool.promise();
    console.log('>>> DATABASE ENGINE: MySQL Connected <<<');
  } catch (err) {
    console.warn('MySQL initialization failed, falling back to Embedded SQLite:', err.message);
    db = require('./sqliteDb');
  }
} else {
  // Default to Embedded SQLite Engine
  db = require('./sqliteDb');
  console.log('>>> DATABASE ENGINE: Embedded SQLite (Zero-Setup & Free) Active <<<');
}

module.exports = db;