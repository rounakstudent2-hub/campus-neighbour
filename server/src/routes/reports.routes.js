import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../utils/helpers.js';

const router = express.Router();

// POST /api/reports - File a report
router.post('/', requireAuth, async (req, res) => {
  try {
    const { reportedUserId, taskId, reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for report is required.' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO reports (id, reporter_id, reported_user_id, task_id, reason, details, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [id, req.user.id, reportedUserId || null, taskId || null, reason.trim(), details ? details.trim() : '', now]
    );

    // If task was reported for severe dispute, optionally flag task
    if (taskId && reason.toLowerCase().includes('dispute')) {
      await db.run(`UPDATE tasks SET status = 'Disputed', updated_at = ? WHERE id = ?`, [now, taskId]);
    }

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our safety moderation team will investigate promptly.'
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
});

// GET /api/reports/my - User view reports they submitted
router.get('/my', requireAuth, async (req, res) => {
  try {
    const reports = await db.query(
      `SELECT r.*, u.full_name as reported_user_name, t.title as task_title
       FROM reports r
       LEFT JOIN users u ON r.reported_user_id = u.id
       LEFT JOIN tasks t ON r.task_id = t.id
       WHERE r.reporter_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, reports: reports.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user reports.' });
  }
});

export default router;
