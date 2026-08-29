const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';

// Helper to fetch full user profile object
const getUserProfile = async (userId, role) => {
  let profile = {};
  if (role === 'student') {
    const [rows] = await db.query(
      `SELECT s.id AS student_id, s.name, s.email, s.branch, s.cgpa, s.resume_url, s.created_at
       FROM students s WHERE s.user_id = ?`,
      [userId]
    );
    if (rows.length > 0) profile = rows[0];
  } else if (role === 'recruiter') {
    const [rows] = await db.query(
      `SELECT r.id AS recruiter_id, r.company_name, r.email, r.created_at
       FROM recruiters r WHERE r.user_id = ?`,
      [userId]
    );
    if (rows.length > 0) profile = rows[0];
  }
  return profile;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, role, name, email, branch, cgpa, resume_url, company_name } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ status: 'error', message: 'Username, password, and role are required.' });
  }

  if (!['student', 'recruiter', 'admin'].includes(role)) {
    return res.status(400).json({ status: 'error', message: 'Invalid user role specified.' });
  }

  // Get dedicated connection for transaction
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Check username uniqueness
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({ status: 'error', message: 'Username is already taken.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user record
    const [userResult] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username.trim(), hashedPassword, role]
    );
    const userId = userResult.insertId;

    if (role === 'student') {
      const studentEmail = email ? email.trim() : `${username}@student.edu`;
      const studentName = name ? name.trim() : username;
      const parsedCgpa = cgpa !== undefined && cgpa !== '' ? parseFloat(cgpa) : 0.00;

      // Check if student email is already in use
      const [existingEmail] = await connection.query('SELECT id FROM students WHERE email = ?', [studentEmail]);
      if (existingEmail.length > 0) {
        await connection.rollback();
        return res.status(409).json({ status: 'error', message: 'Email address is already registered to another student.' });
      }

      await connection.query(
        'INSERT INTO students (user_id, name, email, branch, cgpa, resume_url) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, studentName, studentEmail, branch || 'Computer Science', parsedCgpa, resume_url || null]
      );
    } else if (role === 'recruiter') {
      const orgName = company_name ? company_name.trim() : 'Tech Organization';
      const recruiterEmail = email ? email.trim() : `${username}@company.com`;

      // Check if recruiters table has email column, handle gracefully
      try {
        await connection.query(
          'INSERT INTO recruiters (user_id, company_name, email) VALUES (?, ?, ?)',
          [userId, orgName, recruiterEmail]
        );
      } catch (err) {
        // Fallback for legacy database schema without email column
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          await connection.query(
            'INSERT INTO recruiters (user_id, company_name) VALUES (?, ?)',
            [userId, orgName]
          );
        } else {
          throw err;
        }
      }
    }

    await connection.commit();

    return res.status(201).json({
      status: 'success',
      message: 'Account successfully registered! Please sign in to continue.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Registration transaction error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Database error during registration.'
    });
  } finally {
    connection.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Please enter both username and password.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (users.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid username or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid username or password.' });
    }

    // Fetch related profile details
    const profile = await getUserProfile(user.id, user.role);

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      ...profile
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        ...profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error during login.' });
  }
});

// GET /api/auth/me - Restore active authenticated session
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User account not found.' });
    }

    const user = users[0];
    const profile = await getUserProfile(user.id, user.role);

    return res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        ...profile
      }
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to verify active session.' });
  }
});

module.exports = router;
