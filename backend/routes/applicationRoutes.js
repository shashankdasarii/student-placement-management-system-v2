const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// POST /api/applications/apply - Student applies for an eligible job
router.post('/apply', verifyToken, authorize('student'), async (req, res) => {
  const { job_id } = req.body;

  if (!job_id) {
    return res.status(400).json({ status: 'error', message: 'Job ID is required to apply.' });
  }

  try {
    // 1. Resolve student profile
    const [students] = await db.query(
      'SELECT id, name, cgpa, resume_url FROM students WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    if (students.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student profile not found. Please complete your profile.' });
    }

    const student = students[0];
    const studentCgpa = parseFloat(student.cgpa) || 0.00;

    // 2. Validate job existence and eligibility criteria
    const [jobs] = await db.query(
      'SELECT id, title, min_cgpa, deadline FROM jobs WHERE id = ? LIMIT 1',
      [job_id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Job drive not found.' });
    }

    const job = jobs[0];

    // Check application deadline
    if (new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'The deadline to submit applications for this job drive has expired.'
      });
    }

    // Check CGPA threshold
    if (studentCgpa < parseFloat(job.min_cgpa)) {
      return res.status(403).json({
        status: 'error',
        message: `Ineligible: Your CGPA (${studentCgpa.toFixed(2)}) is below the required minimum (${parseFloat(job.min_cgpa).toFixed(2)}).`
      });
    }

    // 3. Check for existing application
    const [existing] = await db.query(
      'SELECT id FROM applications WHERE student_id = ? AND job_id = ?',
      [student.id, job_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'You have already applied for this job drive.'
      });
    }

    // 4. Insert new application
    const [result] = await db.query(
      "INSERT INTO applications (student_id, job_id, status) VALUES (?, ?, 'Applied')",
      [student.id, job_id]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully!',
      applicationId: result.insertId
    });
  } catch (error) {
    console.error('Apply error:', error);
    return res.status(500).json({ status: 'error', message: 'Database error while submitting application.' });
  }
});

// GET /api/applications/my - Student fetches their applications with real-time status
router.get('/my', verifyToken, authorize('student'), async (req, res) => {
  try {
    const [students] = await db.query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (students.length === 0) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const studentId = students[0].id;

    const query = `
      SELECT 
        a.id, 
        a.job_id,
        a.status, 
        a.applied_at, 
        j.title, 
        j.description, 
        j.min_cgpa, 
        j.deadline, 
        COALESCE(r.company_name, 'Campus Partner') AS company_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN recruiters r ON j.company_id = r.id
      WHERE a.student_id = ?
      ORDER BY a.applied_at DESC
    `;

    const [applications] = await db.query(query, [studentId]);

    return res.status(200).json({ status: 'success', data: applications });
  } catch (error) {
    console.error('Fetch student applications error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve applications.' });
  }
});

// GET /api/applications/job/:jobId - Recruiter reviews candidates for a job
router.get('/job/:jobId', verifyToken, authorize('recruiter'), async (req, res) => {
  const { jobId } = req.params;

  try {
    // 1. Resolve recruiter ID
    const [recruiters] = await db.query('SELECT id FROM recruiters WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (recruiters.length === 0) {
      return res.status(403).json({ status: 'error', message: 'Recruiter account not found.' });
    }
    const recruiterId = recruiters[0].id;

    // 2. Verify ownership of the job
    const [jobs] = await db.query('SELECT id, title FROM jobs WHERE id = ? AND company_id = ? LIMIT 1', [jobId, recruiterId]);
    if (jobs.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized: You can only view applicants for job drives created by your organization.'
      });
    }

    // 3. Fetch candidates joining students on a.student_id = s.id
    const query = `
      SELECT 
        a.id AS application_id, 
        a.status, 
        a.applied_at, 
        s.id AS student_id,
        s.name, 
        s.email, 
        s.branch, 
        s.cgpa, 
        s.resume_url,
        u.username
      FROM applications a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE a.job_id = ?
      ORDER BY s.cgpa DESC, a.applied_at ASC
    `;

    const [applicants] = await db.query(query, [jobId]);

    return res.status(200).json({ status: 'success', data: applicants, job_title: jobs[0].title });
  } catch (error) {
    console.error('Fetch job applicants error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve job applicants.' });
  }
});

// PUT /api/applications/:id/status - Recruiter updates application status
router.put('/:id/status', verifyToken, authorize('recruiter'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Applied', 'Shortlisted', 'Interviewing', 'Accepted', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    // 1. Resolve recruiter ID
    const [recruiters] = await db.query('SELECT id FROM recruiters WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (recruiters.length === 0) {
      return res.status(403).json({ status: 'error', message: 'Recruiter account not found.' });
    }
    const recruiterId = recruiters[0].id;

    // 2. Verify ownership: the application must belong to a job posted by this recruiter
    const [applications] = await db.query(
      `SELECT a.id, j.company_id 
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }

    if (applications[0].company_id !== recruiterId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized: You cannot modify candidate applications for other organizations.'
      });
    }

    // 3. Update status
    await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);

    return res.status(200).json({
      status: 'success',
      message: `Application status successfully updated to ${status}!`
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update application status.' });
  }
});

module.exports = router;
