const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// Helper to resolve recruiter ID from authenticated user
const resolveRecruiterId = async (userId) => {
  const [rows] = await db.query('SELECT id, company_name FROM recruiters WHERE user_id = ? LIMIT 1', [userId]);
  if (rows.length > 0) {
    return rows[0].id;
  }
  // Fallback: create recruiter profile if missing
  const [insert] = await db.query('INSERT INTO recruiters (user_id, company_name) VALUES (?, ?)', [userId, 'Campus Recruiter']);
  return insert.insertId;
};

// Helper to resolve student ID & CGPA from authenticated user
const resolveStudentInfo = async (userId) => {
  const [rows] = await db.query('SELECT id, name, cgpa FROM students WHERE user_id = ? LIMIT 1', [userId]);
  if (rows.length > 0) {
    return rows[0];
  }
  return null;
};

// GET /api/jobs/eligible - Student automated CGPA eligibility engine
router.get('/eligible', verifyToken, authorize('student'), async (req, res) => {
  try {
    const student = await resolveStudentInfo(req.user.id);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
    }

    const studentCgpa = parseFloat(student.cgpa) || 0.00;

    // Filter jobs where student CGPA >= job min_cgpa and drive deadline is in the future
    const query = `
      SELECT 
        j.id, 
        j.company_id, 
        j.title, 
        j.description, 
        j.min_cgpa, 
        j.deadline, 
        j.created_at,
        COALESCE(r.company_name, 'Campus Recruiter') AS company_name,
        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS has_applied,
        a.id AS application_id,
        a.status AS application_status
      FROM jobs j
      LEFT JOIN recruiters r ON j.company_id = r.id
      LEFT JOIN applications a ON a.job_id = j.id AND a.student_id = ?
      WHERE j.min_cgpa <= ?
        AND j.deadline >= NOW()
      ORDER BY j.deadline ASC, j.created_at DESC
    `;

    const [jobs] = await db.query(query, [student.id, studentCgpa]);

    return res.status(200).json({
      status: 'success',
      data: jobs,
      student_cgpa: studentCgpa
    });
  } catch (error) {
    console.error('Error fetching eligible jobs:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve eligible job drives.' });
  }
});

// GET /api/jobs/recruiter - Get all jobs posted by logged-in recruiter with live applicant metrics
router.get('/recruiter', verifyToken, authorize('recruiter'), async (req, res) => {
  try {
    const recruiterId = await resolveRecruiterId(req.user.id);

    const query = `
      SELECT 
        j.id, 
        j.company_id, 
        j.title, 
        j.description, 
        j.min_cgpa, 
        j.deadline, 
        j.created_at,
        COUNT(a.id) AS applicant_count,
        SUM(CASE WHEN a.status = 'Shortlisted' THEN 1 ELSE 0 END) AS shortlisted_count,
        SUM(CASE WHEN a.status = 'Accepted' THEN 1 ELSE 0 END) AS accepted_count
      FROM jobs j
      LEFT JOIN applications a ON a.job_id = j.id
      WHERE j.company_id = ?
      GROUP BY j.id
      ORDER BY j.id DESC
    `;

    const [jobs] = await db.query(query, [recruiterId]);

    return res.status(200).json({
      status: 'success',
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching recruiter jobs:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch recruiter job drives.' });
  }
});

// POST /api/jobs - Recruiter posts a new job drive
router.post('/', verifyToken, authorize('recruiter'), async (req, res) => {
  const { title, description, min_cgpa, deadline } = req.body;

  if (!title || !description || !deadline) {
    return res.status(400).json({
      status: 'error',
      message: 'Title, description, and application deadline are required.'
    });
  }

  const parsedCgpa = parseFloat(min_cgpa) || 0.00;
  if (parsedCgpa < 0 || parsedCgpa > 10) {
    return res.status(400).json({ status: 'error', message: 'Minimum CGPA must be between 0.00 and 10.00.' });
  }

  try {
    const recruiterId = await resolveRecruiterId(req.user.id);

    const [result] = await db.query(
      'INSERT INTO jobs (company_id, title, description, min_cgpa, deadline) VALUES (?, ?, ?, ?, ?)',
      [recruiterId, title.trim(), description.trim(), parsedCgpa, deadline]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Job drive posted successfully!',
      jobId: result.insertId
    });
  } catch (error) {
    console.error('Error posting job drive:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Database error creating job drive.'
    });
  }
});

// GET /api/jobs - Public/General listing of all active jobs
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        j.id, 
        j.company_id, 
        j.title, 
        j.description, 
        j.min_cgpa, 
        j.deadline, 
        j.created_at,
        COALESCE(r.company_name, 'Campus Partner') AS company_name
      FROM jobs j
      LEFT JOIN recruiters r ON j.company_id = r.id
      ORDER BY j.created_at DESC
    `;
    const [jobs] = await db.query(query);
    return res.status(200).json({ status: 'success', data: jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ status: 'error', message: 'Error retrieving job listings.' });
  }
});

module.exports = router;