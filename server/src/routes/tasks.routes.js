import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { calculateDistance, createNotification } from '../utils/helpers.js';

const router = express.Router();

// GET all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query('SELECT * FROM task_categories WHERE is_active = 1 ORDER BY name ASC');
    return res.json({ success: true, categories: categories.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// GET /api/tasks - Browse and filter tasks
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      locality,
      pincode,
      minBudget,
      maxBudget,
      status,
      lat,
      lng,
      maxDistance = 25, // km
      customerId,
      assignedStudentId
    } = req.query;

    let query = `
      SELECT t.*, 
             c.name as category_name, c.icon as category_icon,
             u.full_name as customer_name, u.avatar_url as customer_avatar, u.locality as customer_locality,
             (SELECT COUNT(*) FROM applications a WHERE a.task_id = t.id) as applications_count,
             s.full_name as assigned_student_name, s.avatar_url as assigned_student_avatar
      FROM tasks t
      JOIN task_categories c ON t.category_id = c.id
      JOIN users u ON t.customer_id = u.id
      LEFT JOIN users s ON t.assigned_student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (customerId) {
      query += ` AND t.customer_id = ?`;
      params.push(customerId);
    }

    if (assignedStudentId) {
      query += ` AND t.assigned_student_id = ?`;
      params.push(assignedStudentId);
    }

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    } else if (!customerId && !assignedStudentId) {
      // By default when students/public browse, show Open & Applied tasks
      query += ` AND t.status IN ('Open', 'Applied')`;
    }

    if (category) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (search) {
      query += ` AND (t.title LIKE ? OR t.description LIKE ? OR t.locality LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (locality) {
      query += ` AND t.locality LIKE ?`;
      params.push(`%${locality}%`);
    }

    if (pincode) {
      query += ` AND t.pincode = ?`;
      params.push(pincode);
    }

    if (minBudget) {
      query += ` AND t.budget >= ?`;
      params.push(parseFloat(minBudget));
    }

    if (maxBudget) {
      query += ` AND t.budget <= ?`;
      params.push(parseFloat(maxBudget));
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await db.query(query, params);
    let tasks = result.rows;

    // Calculate distance if lat and lng provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      tasks = tasks.map(task => {
        const dist = calculateDistance(userLat, userLng, task.latitude, task.longitude);
        return { ...task, distance_km: dist };
      });

      // Filter by max distance if requested
      if (maxDistance) {
        const maxDist = parseFloat(maxDistance);
        tasks = tasks.filter(t => t.distance_km === null || t.distance_km <= maxDist);
      }

      // Sort by distance
      tasks.sort((a, b) => {
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    return res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks.', error: error.message });
  }
});

// GET /api/tasks/:id - Single task details
router.get('/:id', async (req, res) => {
  try {
    const task = await db.get(
      `SELECT t.*, 
              c.name as category_name, c.icon as category_icon,
              u.full_name as customer_name, u.avatar_url as customer_avatar, u.phone as customer_phone, u.locality as customer_locality, u.address as customer_address,
              s.full_name as assigned_student_name, s.avatar_url as assigned_student_avatar, s.phone as assigned_student_phone
       FROM tasks t
       JOIN task_categories c ON t.category_id = c.id
       JOIN users u ON t.customer_id = u.id
       LEFT JOIN users s ON t.assigned_student_id = s.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Get applications count
    const apps = await db.query(
      `SELECT a.*, u.full_name as student_name, u.avatar_url as student_avatar, u.locality as student_locality,
              sp.college_name, sp.education_level, sp.skills, sp.average_rating, sp.ratings_count, sp.total_tasks_completed
       FROM applications a
       JOIN users u ON a.student_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE a.task_id = ?
       ORDER BY a.created_at DESC`,
      [task.id]
    );

    // Format skills
    apps.rows.forEach(app => {
      try { app.skills = JSON.parse(app.skills); } catch(e) {}
    });

    return res.json({ success: true, task, applications: apps.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch task details.' });
  }
});

// POST /api/tasks - Create new task (Neighbor only)
router.post('/', requireAuth, requireRole('neighbor', 'admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      budget,
      deadline,
      address,
      locality,
      city = 'Bengaluru',
      pincode,
      latitude,
      longitude
    } = req.body;

    if (!title || !description || !categoryId || !budget || !deadline) {
      return res.status(400).json({ success: false, message: 'Title, description, category, budget, and deadline are required.' });
    }

    // Validate category
    const cat = await db.get('SELECT id FROM task_categories WHERE id = ?', [categoryId]);
    if (!cat) {
      return res.status(400).json({ success: false, message: 'Invalid category selected.' });
    }

    const taskId = uuidv4();
    const now = new Date().toISOString();

    const lat = latitude ? parseFloat(latitude) : (req.user.latitude || 12.9716);
    const lng = longitude ? parseFloat(longitude) : (req.user.longitude || 77.5946);
    const loc = locality || req.user.locality || 'Indiranagar';
    const pin = pincode || req.user.pincode || '560038';
    const addr = address || req.user.address || 'Neighborhood address';

    await db.run(
      `INSERT INTO tasks (id, customer_id, category_id, title, description, budget, deadline, address, locality, city, pincode, latitude, longitude, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?)`,
      [taskId, req.user.id, categoryId, title.trim(), description.trim(), parseFloat(budget), deadline, addr, loc, city, pin, lat, lng, now, now]
    );

    // Update customer total posted
    await db.run('UPDATE customer_profiles SET total_tasks_posted = total_tasks_posted + 1 WHERE user_id = ?', [req.user.id]);

    const createdTask = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);

    return res.status(201).json({
      success: true,
      message: 'Task posted successfully! Nearby students can now discover and apply.',
      task: createdTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ success: false, message: 'Failed to create task.', error: error.message });
  }
});

// PUT /api/tasks/:id - Update task details (Owner only, only if Open)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (task.status !== 'Open' && task.status !== 'Applied' && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Task cannot be modified after it has been assigned.' });
    }

    const { title, description, budget, deadline, address, locality, pincode } = req.body;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        budget = COALESCE(?, budget),
        deadline = COALESCE(?, deadline),
        address = COALESCE(?, address),
        locality = COALESCE(?, locality),
        pincode = COALESCE(?, pincode),
        updated_at = ?
       WHERE id = ?`,
      [title, description, budget ? parseFloat(budget) : null, deadline, address, locality, pincode, now, task.id]
    );

    const updated = await db.get('SELECT * FROM tasks WHERE id = ?', [task.id]);
    return res.json({ success: true, message: 'Task updated successfully.', task: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
});

// POST /api/tasks/:id/assign - Customer selects and assigns a student
router.post('/:id/assign', requireAuth, requireRole('neighbor', 'admin'), async (req, res) => {
  try {
    const { studentId, agreedFee } = req.body;
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to assign this task.' });
    }

    if (task.status !== 'Open' && task.status !== 'Applied') {
      return res.status(400).json({ success: false, message: `Task cannot be assigned because its status is ${task.status}.` });
    }

    const student = await db.get("SELECT id, full_name, email FROM users WHERE id = ? AND role = 'student'", [studentId]);
    if (!student) return res.status(404).json({ success: false, message: 'Student helper not found.' });

    const now = new Date().toISOString();
    const finalFee = agreedFee ? parseFloat(agreedFee) : task.budget;

    // 1. Update task status & assigned student
    await db.run(
      `UPDATE tasks SET status = 'Assigned', assigned_student_id = ?, updated_at = ? WHERE id = ?`,
      [studentId, now, task.id]
    );

    // 2. Update application status to Accepted, others to Rejected
    await db.run(
      `UPDATE applications SET status = 'Accepted', updated_at = ? WHERE task_id = ? AND student_id = ?`,
      [now, task.id, studentId]
    );
    await db.run(
      `UPDATE applications SET status = 'Rejected', updated_at = ? WHERE task_id = ? AND student_id != ?`,
      [now, task.id, studentId]
    );

    // 3. Create Assignment record
    const assignmentId = uuidv4();
    await db.run(
      `INSERT INTO assignments (id, task_id, student_id, agreed_fee, assigned_at, status)
       VALUES (?, ?, ?, ?, ?, 'Assigned')`,
      [assignmentId, task.id, studentId, finalFee, now]
    );

    // 4. Create or get Conversation
    let conv = await db.get(
      'SELECT id FROM conversations WHERE task_id = ? AND customer_id = ? AND student_id = ?',
      [task.id, task.customer_id, studentId]
    );
    if (!conv) {
      const convId = uuidv4();
      await db.run(
        `INSERT INTO conversations (id, task_id, customer_id, student_id, last_message_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [convId, task.id, task.customer_id, studentId, now, now]
      );
      // Create initial greeting system message
      await db.run(
        `INSERT INTO messages (id, conversation_id, sender_id, message_text, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [uuidv4(), convId, task.customer_id, `Hello ${student.full_name}! I have assigned you this task: "${task.title}". Feel free to ask any questions here.`, now]
      );
    }

    // 5. Create Payment record (escrow hold state)
    const paymentId = uuidv4();
    await db.run(
      `INSERT INTO payments (id, task_id, customer_id, student_id, amount, currency, status, payment_gateway, transaction_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'INR', 'escrow_held', 'Razorpay', 'escrow_hold', ?, ?)`,
      [paymentId, task.id, task.customer_id, studentId, finalFee, now, now]
    );

    // 6. Send Notification to Student
    await createNotification(
      studentId,
      '🎉 You have been hired!',
      `Congratulations! You were assigned the task: "${task.title}" for ₹${finalFee}. You can now coordinate with the neighbor and start work.`,
      'task_assigned',
      `/dashboard/tasks/${task.id}`,
      req.app.get('io')
    );

    return res.json({
      success: true,
      message: `Task successfully assigned to ${student.full_name}!`,
      taskStatus: 'Assigned'
    });
  } catch (error) {
    console.error('Assign error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign task.', error: error.message });
  }
});

// POST /api/tasks/:id/start - Student starts the task
router.post('/:id/start', requireAuth, requireRole('student', 'admin'), async (req, res) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.assigned_student_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not assigned to this task.' });
    }

    if (task.status !== 'Assigned') {
      return res.status(400).json({ success: false, message: `Cannot start task from status "${task.status}". Expected "Assigned".` });
    }

    const now = new Date().toISOString();
    await db.run(`UPDATE tasks SET status = 'In Progress', updated_at = ? WHERE id = ?`, [now, task.id]);
    await db.run(`UPDATE assignments SET started_at = ?, status = 'In Progress' WHERE task_id = ?`, [now, task.id]);

    // Notify Customer
    await createNotification(
      task.customer_id,
      '🚀 Task Started',
      `${req.user.full_name} has started working on "${task.title}".`,
      'task_started',
      `/dashboard/tasks/${task.id}`,
      req.app.get('io')
    );

    return res.json({ success: true, message: 'Task is now In Progress.', status: 'In Progress' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to start task.' });
  }
});

// POST /api/tasks/:id/complete - Student marks work as completed
router.post('/:id/complete', requireAuth, requireRole('student', 'admin'), async (req, res) => {
  try {
    const { completionProof } = req.body;
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.assigned_student_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (task.status !== 'In Progress' && task.status !== 'Assigned') {
      return res.status(400).json({ success: false, message: `Cannot complete task from status "${task.status}".` });
    }

    const now = new Date().toISOString();
    await db.run(
      `UPDATE tasks SET status = 'Completed', completion_proof = ?, updated_at = ? WHERE id = ?`,
      [completionProof || 'Completed as requested.', now, task.id]
    );

    await db.run(`UPDATE assignments SET completed_at = ?, status = 'Completed' WHERE task_id = ?`, [now, task.id]);

    // Notify Customer to confirm completion & release payment
    await createNotification(
      task.customer_id,
      '✅ Task Marked as Completed',
      `${req.user.full_name} has completed the task: "${task.title}". Please confirm completion and release payment.`,
      'task_completed',
      `/dashboard/tasks/${task.id}`,
      req.app.get('io')
    );

    return res.json({ success: true, message: 'Work marked as completed! Awaiting neighbor confirmation.', status: 'Completed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to complete task.' });
  }
});

// POST /api/tasks/:id/confirm - Customer confirms completion and releases payment
router.post('/:id/confirm', requireAuth, requireRole('neighbor', 'admin'), async (req, res) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (task.status !== 'Completed') {
      return res.status(400).json({ success: false, message: `Cannot confirm task because status is "${task.status}".` });
    }

    const now = new Date().toISOString();

    // 1. Release Payment
    await db.run(
      `UPDATE payments SET status = 'released', updated_at = ? WHERE task_id = ?`,
      [now, task.id]
    );

    // 2. Update Student Earnings & Completed Count
    await db.run(
      `UPDATE student_profiles SET 
        total_tasks_completed = total_tasks_completed + 1,
        total_earnings = total_earnings + ?
       WHERE user_id = ?`,
      [task.budget, task.assigned_student_id]
    );

    // 3. Notify Student
    await createNotification(
      task.assigned_student_id,
      '💰 Payment Released!',
      `The neighbor confirmed completion for "${task.title}". ₹${task.budget} has been credited to your earnings! Please leave a review.`,
      'payment_received',
      `/dashboard/tasks/${task.id}`,
      req.app.get('io')
    );

    return res.json({
      success: true,
      message: 'Completion confirmed and payment released to student helper! You can now leave a review.',
      taskStatus: 'Completed'
    });
  } catch (error) {
    console.error('Confirm error:', error);
    return res.status(500).json({ success: false, message: 'Failed to confirm task completion.' });
  }
});

// POST /api/tasks/:id/cancel - Cancel task (Only Open tasks, or Admin)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (task.status === 'Completed' || task.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: `Cannot cancel a task that is already ${task.status}.` });
    }

    const now = new Date().toISOString();
    await db.run(`UPDATE tasks SET status = 'Cancelled', updated_at = ? WHERE id = ?`, [now, task.id]);

    // If payment was held, refund it
    await db.run(
      `UPDATE payments SET status = 'refunded', updated_at = ? WHERE task_id = ? AND status = 'escrow_held'`,
      [now, task.id]
    );

    // If student was assigned, notify them
    if (task.assigned_student_id) {
      await createNotification(
        task.assigned_student_id,
        '⚠️ Task Cancelled',
        `The task "${task.title}" has been cancelled. Reason: ${reason || 'Cancelled by customer'}.`,
        'task_status_changed',
        `/dashboard/tasks/${task.id}`,
        req.app.get('io')
      );
    }

    return res.json({ success: true, message: 'Task cancelled successfully.', status: 'Cancelled' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel task.' });
  }
});

export default router;
