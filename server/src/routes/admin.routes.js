import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createNotification } from '../utils/helpers.js';

const router = express.Router();

// Require admin role for all routes in this file
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/stats - Platform overview statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const totalStudents = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const totalCustomers = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'neighbor'");
    const totalTasks = await db.get('SELECT COUNT(*) as count FROM tasks');
    const activeTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status IN ('Open', 'Applied', 'Assigned', 'In Progress')");
    const completedTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'Completed'");
    const disputedTasks = await db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'Disputed'");
    const totalPayments = await db.get("SELECT SUM(amount) as sum FROM payments WHERE status = 'released'");
    const pendingReports = await db.get("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");

    // Tasks by category breakdown
    const categoryStats = await db.query(
      `SELECT c.name, COUNT(t.id) as task_count
       FROM task_categories c
       LEFT JOIN tasks t ON c.id = t.category_id
       GROUP BY c.id, c.name
       ORDER BY task_count DESC`
    );

    // Recent activity log (latest tasks and reports)
    const recentTasks = await db.query(
      `SELECT t.id, t.title, t.budget, t.status, t.created_at, u.full_name as customer_name
       FROM tasks t
       JOIN users u ON t.customer_id = u.id
       ORDER BY t.created_at DESC LIMIT 5`
    );

    return res.json({
      success: true,
      stats: {
        totalUsers: totalUsers.count,
        totalStudents: totalStudents.count,
        totalCustomers: totalCustomers.count,
        totalTasks: totalTasks.count,
        activeTasks: activeTasks.count,
        completedTasks: completedTasks.count,
        disputedTasks: disputedTasks.count,
        totalVolume: totalPayments && totalPayments.sum ? totalPayments.sum : 0,
        pendingReports: pendingReports.count
      },
      categoryStats: categoryStats.rows,
      recentTasks: recentTasks.rows
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/users - User management with search, filter, and pagination
router.get('/users', async (req, res) => {
  try {
    const { role, search, status } = req.query;
    let query = `
      SELECT u.id, u.email, u.full_name, u.role, u.phone, u.locality, u.city, u.is_verified, u.is_active, u.created_at,
             sp.college_name, sp.average_rating, sp.total_tasks_completed, sp.total_earnings,
             cp.total_tasks_posted
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status) {
      query += ` AND u.is_active = ?`;
      params.push(status === 'active' ? 1 : 0);
    }

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.locality LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await db.query(query, params);
    return res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// PUT /api/admin/users/:id/status - Toggle activate / suspend user account
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive, isVerified } = req.body;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.role === 'admin' && req.user.id === user.id && isActive === false) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own administrator account.' });
    }

    const newActive = isActive !== undefined ? (isActive ? 1 : 0) : user.is_active;
    const newVerified = isVerified !== undefined ? (isVerified ? 1 : 0) : user.is_verified;

    await db.run(
      'UPDATE users SET is_active = ?, is_verified = ?, updated_at = ? WHERE id = ?',
      [newActive, newVerified, new Date().toISOString(), user.id]
    );

    return res.json({
      success: true,
      message: `User account ${newActive ? 'activated' : 'suspended'} successfully.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
});

// GET /api/admin/tasks - All tasks with full administrative detail
router.get('/tasks', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT t.*, c.name as category_name,
             u.full_name as customer_name, u.email as customer_email,
             s.full_name as student_name, s.email as student_email
      FROM tasks t
      JOIN task_categories c ON t.category_id = c.id
      JOIN users u ON t.customer_id = u.id
      LEFT JOIN users s ON t.assigned_student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (t.title LIKE ? OR t.locality LIKE ? OR u.full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.created_at DESC`;
    const result = await db.query(query, params);
    return res.json({ success: true, count: result.rows.length, tasks: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin tasks.' });
  }
});

// PUT /api/admin/tasks/:id/status - Moderate or override task status
router.put('/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Open', 'Applied', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'Disputed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    await db.run('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), req.params.id]);
    return res.json({ success: true, message: `Task status updated to ${status}.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update task status.' });
  }
});

// GET /api/admin/reports - View all reports and complaints
router.get('/reports', async (req, res) => {
  try {
    const reports = await db.query(
      `SELECT r.*,
              rep.full_name as reporter_name, rep.email as reporter_email,
              target.full_name as reported_user_name, target.email as reported_user_email,
              t.title as task_title
       FROM reports r
       JOIN users rep ON r.reporter_id = rep.id
       LEFT JOIN users target ON r.reported_user_id = target.id
       LEFT JOIN tasks t ON r.task_id = t.id
       ORDER BY r.created_at DESC`
    );
    return res.json({ success: true, reports: reports.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
});

// PUT /api/admin/reports/:id - Resolve or dismiss a report
router.put('/reports/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status.' });
    }

    const now = new Date().toISOString();
    await db.run(
      'UPDATE reports SET status = ?, admin_notes = ?, resolved_at = ? WHERE id = ?',
      [status, adminNotes || '', status === 'resolved' || status === 'dismissed' ? now : null, req.params.id]
    );

    return res.json({ success: true, message: `Report marked as ${status}.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
});

// GET /api/admin/categories - Category management
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query(
      `SELECT c.*, (SELECT COUNT(*) FROM tasks t WHERE t.category_id = c.id) as task_count
       FROM task_categories c
       ORDER BY c.name ASC`
    );
    return res.json({ success: true, categories: categories.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// POST /api/admin/categories - Create new category
router.post('/categories', async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      'INSERT INTO task_categories (id, name, slug, description, icon, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [id, name.trim(), slug, description || '', icon || 'Tag', now]
    );

    return res.status(201).json({ success: true, message: 'Category created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Category name or slug already exists.' });
  }
});

// PUT /api/admin/categories/:id - Toggle category active status or edit
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description, icon, isActive } = req.body;
    await db.run(
      `UPDATE task_categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, description, icon, isActive !== undefined ? (isActive ? 1 : 0) : null, req.params.id]
    );
    return res.json({ success: true, message: 'Category updated.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
});

export default router;
