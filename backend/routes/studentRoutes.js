const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// Ensure upload directory exists recursively
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// GET /api/students/profile
router.get('/profile', verifyToken, authorize('student'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.user_id, s.name, s.email, s.branch, s.cgpa, s.resume_url, u.username, s.created_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
    }

    return res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({ status: 'error', message: 'Database error fetching profile.' });
  }
});

// Configure disk storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    cb(null, `resume-${cleanName}-${uniqueSuffix}.pdf`);
  }
});

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  if (isPdfMime || isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF documents are supported.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter
});

// POST /api/students/upload-resume
router.post('/upload-resume', verifyToken, authorize('student'), (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'error', message: 'File is too large. Maximum allowed size is 5MB.' });
      }
      return res.status(400).json({ status: 'error', message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No PDF file attached in request.' });
  }

  const relativeUrl = `/uploads/resumes/${req.file.filename}`;

  try {
    await db.query(
      'UPDATE students SET resume_url = ? WHERE user_id = ?',
      [relativeUrl, req.user.id]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Resume PDF uploaded successfully!',
      resume_url: relativeUrl
    });
  } catch (error) {
    console.error('Error updating resume URL:', error);
    return res.status(500).json({ status: 'error', message: 'Database error saving resume URL.' });
  }
});

module.exports = router;
