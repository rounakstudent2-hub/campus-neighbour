import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../utils/helpers.js';

const router = express.Router();

// POST /api/reviews - Submit a review
router.post('/', requireAuth, async (req, res) => {
  try {
    const { taskId, revieweeId, rating, comment } = req.body;

    if (!taskId || !revieweeId || !rating) {
      return res.status(400).json({ success: false, message: 'Task ID, reviewee ID, and rating (1-5) are required.' });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
    }

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Verify reviewer was part of this task
    if (task.customer_id !== req.user.id && task.assigned_student_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You were not a participant in this task.' });
    }

    // Check duplicate review
    const existing = await db.get(
      'SELECT id FROM reviews WHERE task_id = ? AND reviewer_id = ? AND reviewee_id = ?',
      [taskId, req.user.id, revieweeId]
    );

    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already submitted a review for this task.' });
    }

    const reviewId = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO reviews (id, task_id, reviewer_id, reviewee_id, rating, comment, is_moderated, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [reviewId, taskId, req.user.id, revieweeId, numRating, comment ? comment.trim() : '', now]
    );

    // If reviewee is a student, recalculate their average rating
    const studentProfile = await db.get('SELECT * FROM student_profiles WHERE user_id = ?', [revieweeId]);
    if (studentProfile) {
      const avgResult = await db.get(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM reviews WHERE reviewee_id = ? AND is_moderated = 0',
        [revieweeId]
      );
      if (avgResult) {
        const newAvg = Math.round((avgResult.avg_rating || numRating) * 10) / 10;
        await db.run(
          'UPDATE student_profiles SET average_rating = ?, ratings_count = ? WHERE user_id = ?',
          [newAvg, avgResult.total_ratings, revieweeId]
        );
      }
    }

    // Send notification to reviewee
    await createNotification(
      revieweeId,
      '⭐ New Review Received',
      `${req.user.full_name} left you a ${numRating}-star review for "${task.title}": "${comment || 'Great experience!'}"`,
      'review_received',
      `/dashboard/tasks/${task.id}`,
      req.app.get('io')
    );

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been recorded.'
    });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

// GET /api/reviews/task/:taskId - Get reviews for a task
router.get('/task/:taskId', async (req, res) => {
  try {
    const reviews = await db.query(
      `SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.task_id = ? AND r.is_moderated = 0
       ORDER BY r.created_at DESC`,
      [req.params.taskId]
    );
    return res.json({ success: true, reviews: reviews.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch task reviews.' });
  }
});

export default router;
