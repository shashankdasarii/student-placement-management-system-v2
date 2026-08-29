const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'placement.db');
const sqlite = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for high performance and integrity
sqlite.exec('PRAGMA foreign_keys = ON;');
sqlite.exec('PRAGMA journal_mode = WAL;');

// Register MySQL compatibility functions
sqlite.function('now', () => new Date().toISOString().replace('T', ' ').slice(0, 19));
sqlite.function('NOW', () => new Date().toISOString().replace('T', ' ').slice(0, 19));

// Initialize Schema
sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cgpa REAL NOT NULL DEFAULT 0.00,
  branch TEXT NOT NULL,
  resume_url TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS recruiters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  email TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  min_cgpa REAL NOT NULL DEFAULT 0.00,
  deadline DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES recruiters(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Applied',
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(student_id, job_id)
);
`);

// Auto-seed default records if users table is empty
const checkUsers = sqlite.prepare('SELECT COUNT(*) as count FROM users').get();
if (!checkUsers || checkUsers.count === 0) {
  console.log('>>> Seeding initial embedded SQLite database records... <<<');
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // Seed Users
  const insertUser = sqlite.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
  const u1 = insertUser.run('john_student', defaultPasswordHash, 'student');
  const u2 = insertUser.run('techcorp_hr', defaultPasswordHash, 'recruiter');
  const u3 = insertUser.run('admin_user', defaultPasswordHash, 'admin');
  const u4 = insertUser.run('alex_student', defaultPasswordHash, 'student');
  const u5 = insertUser.run('google_recruiter', defaultPasswordHash, 'recruiter');
  const u6 = insertUser.run('Sasi', defaultPasswordHash, 'student');

  // Seed Students
  const insertStudent = sqlite.prepare('INSERT INTO students (user_id, name, email, cgpa, branch, resume_url) VALUES (?, ?, ?, ?, ?, ?)');
  insertStudent.run(Number(u1.lastInsertRowid), 'John Doe', 'john.doe@example.com', 8.75, 'Computer Science', 'https://example.com/resumes/john_doe.pdf');
  insertStudent.run(Number(u4.lastInsertRowid), 'Alex Smith', 'alex.smith@example.com', 9.10, 'Computer Science', null);
  insertStudent.run(Number(u6.lastInsertRowid), 'Sasi Chowdary', 'sasi@student.edu', 8.45, 'Computer Science', null);

  // Seed Recruiters
  const insertRecruiter = sqlite.prepare('INSERT INTO recruiters (user_id, company_name, email) VALUES (?, ?, ?)');
  const r1 = insertRecruiter.run(Number(u2.lastInsertRowid), 'TechCorp Solutions', 'hr@techcorp.com');
  const r2 = insertRecruiter.run(Number(u5.lastInsertRowid), 'Google', 'campus@google.com');

  // Seed Job Drives
  const insertJob = sqlite.prepare('INSERT INTO jobs (company_id, title, description, min_cgpa, deadline) VALUES (?, ?, ?, ?, ?)');
  insertJob.run(
    Number(r1.lastInsertRowid),
    'Software Engineer - Frontend',
    'Build modern web applications with React, TypeScript, and high-performance design systems.',
    7.50,
    '2026-12-31 23:59:59'
  );
  insertJob.run(
    Number(r1.lastInsertRowid),
    'Full Stack Software Engineer',
    'Build scalable microservices in Node.js and modern relational database architectures.',
    8.00,
    '2026-12-31 23:59:59'
  );
  insertJob.run(
    Number(r2.lastInsertRowid),
    'Associate Software Engineer',
    'Google Cloud Systems team looking for exceptional engineering talent in distributed computing and algorithms.',
    7.00,
    '2026-12-31 23:59:59'
  );
  insertJob.run(
    Number(r2.lastInsertRowid),
    'AI Systems Research Scientist',
    'Design novel deep learning and high-throughput transformer pipelines for real-time inference.',
    8.50,
    '2026-12-31 23:59:59'
  );

  console.log('>>> SQLite seeding complete: Users, Profiles, and Job Drives initialized! <<<');
}

// MySQL2-compatible Promise Wrapper
const sqliteDb = {
  async query(sql, params = []) {
    const cleanSql = sql.trim();

    // Check if query is a SELECT statement
    if (/^\s*SELECT/i.test(cleanSql)) {
      const stmt = sqlite.prepare(cleanSql);
      const rows = stmt.all(...params);
      return [rows, []];
    } else {
      const stmt = sqlite.prepare(cleanSql);
      const info = stmt.run(...params);
      return [{
        insertId: Number(info.lastInsertRowid),
        affectedRows: Number(info.changes)
      }, []];
    }
  },

  async getConnection() {
    return {
      async query(sql, params = []) {
        return sqliteDb.query(sql, params);
      },
      async beginTransaction() {
        try { sqlite.exec('BEGIN TRANSACTION'); } catch (e) {}
      },
      async commit() {
        try { sqlite.exec('COMMIT'); } catch (e) {}
      },
      async rollback() {
        try { sqlite.exec('ROLLBACK'); } catch (e) {}
      },
      release() {}
    };
  }
};

module.exports = sqliteDb;
