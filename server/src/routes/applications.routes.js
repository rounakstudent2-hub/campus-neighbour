import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createNotification } from '../utils/helpers.js';

const router = express.Router();

// POST /api/applications - Apply for a task (Student only)
router.post('/', requireAuth, requireRole('student', 'admin'), async (req, res) => {
  try {
    const { taskId, proposedFee, pitchNote } = req.body;

    if (!taskId || !proposedFee) {
      return res.status(400).json({ success: false, message: 'Task ID and proposed fee are required.' });
    }

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (task.status !== 'Open' && task.status !== 'Applied') {
      return res.status(400).json({
        success: false,
        message: `This task is no longer accepting applications (current status: ${task.status}).`
      });
    }

    if (task.customer_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot apply to your own task.' });
    }

    // Check duplicate application
    const existing = await db.get(
      'SELECT id, status FROM applications WHERE task_id = ? AND student_id = ?',
      [taskId, req.user.id]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `You have already applied for this task (Status: ${existing.status}).`
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO applications (id, task_id, student_id, proposed_fee, pitch_note, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [id, taskId, req.user.id, parseFloat(proposedFee), pitchNote ? pitchNote.trim() : '', now, now]
    );

    // If task was 'Open', change to 'Applied'
    if (task.status === 'Open') {
      await db.run(`UPDATE tasks SET status = 'Applied', updated_at = ? WHERE id = ?`, [now, taskId]);
    }

    // Notify the customer
    await createNotification(
      task.customer_id,
      '📬 New Helper Application',
      `${req.user.full_name} applied to your task "${task.title}" for ₹${proposedFee}.`,
      'application_received',
      `/dashboard/tasks/${task.id}`,
      req.app.get('io')
    );

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully! The neighbor has been notified.',
      applicationId: id
    });
  } catch (error) {
    console.error('Error applying for task:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit application.', error: error.message });
  }
});

// GET /api/applications/my-applications - Get all applications for the logged in student
router.get('/my-applications', requireAuth, requireRole('student', 'admin'), async (req, res) => {
  try {
    const apps = await db.query(
      `SELECT a.*, 
              t.title as task_title, t.description as task_description, t.budget as task_budget, 
              t.deadline as task_deadline, t.status as task_status, t.locality as task_locality,
              t.assigned_student_id,
              c.name as category_name, c.icon as category_icon,
              u.full_name as customer_name, u.avatar_url as customer_avatar
       FROM applications a
       JOIN tasks t ON a.task_id = t.id
       JOIN task_categories c ON t.category_id = c.id
       JOIN users u ON t.customer_id = u.id
       WHERE a.student_id = ?
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    return res.json({ success: true, count: apps.rows.length, applications: apps.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch student applications.' });
  }
});

// DELETE /api/applications/:id - Withdraw application
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const app = await db.get('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (app.student_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (app.status === 'Accepted') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw an accepted application. Please contact the neighbor.' });
    }

    await db.run('DELETE FROM applications WHERE id = ?', [app.id]);

    // Check if task has any remaining applications
    const remaining = await db.get('SELECT COUNT(*) as count FROM applications WHERE task_id = ?', [app.task_id]);
    if (!remaining || remaining.count === 0) {
      await db.run("UPDATE tasks SET status = 'Open' WHERE id = ? AND status = 'Applied'", [app.task_id]);
    }

    return res.json({ success: true, message: 'Application withdrawn successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to withdraw application.' });
  }
});

export default router;
