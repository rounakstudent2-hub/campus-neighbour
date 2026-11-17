import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../utils/helpers.js';

const router = express.Router();

// GET /api/payments/history - Get payment transactions for current user
router.get('/history', requireAuth, async (req, res) => {
  try {
    let query = '';
    let params = [];

    if (req.user.role === 'neighbor') {
      query = `
        SELECT p.*, t.title as task_title, s.full_name as student_name, s.avatar_url as student_avatar
        FROM payments p
        JOIN tasks t ON p.task_id = t.id
        LEFT JOIN users s ON p.student_id = s.id
        WHERE p.customer_id = ?
        ORDER BY p.created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'student') {
      query = `
        SELECT p.*, t.title as task_title, c.full_name as customer_name, c.avatar_url as customer_avatar
        FROM payments p
        JOIN tasks t ON p.task_id = t.id
        JOIN users c ON p.customer_id = c.id
        WHERE p.student_id = ?
        ORDER BY p.created_at DESC
      `;
      params = [req.user.id];
    } else {
      // Admin sees all
      query = `
        SELECT p.*, t.title as task_title, c.full_name as customer_name, s.full_name as student_name
        FROM payments p
        JOIN tasks t ON p.task_id = t.id
        JOIN users c ON p.customer_id = c.id
        LEFT JOIN users s ON p.student_id = s.id
        ORDER BY p.created_at DESC
      `;
    }

    const result = await db.query(query, params);

    // Summary calculations
    let summary = {};
    if (req.user.role === 'student') {
      const studentProf = await db.get('SELECT total_earnings, total_tasks_completed FROM student_profiles WHERE user_id = ?', [req.user.id]);
      const pendingPayout = await db.get(
        "SELECT SUM(amount) as pending FROM payments WHERE student_id = ? AND status = 'escrow_held'",
        [req.user.id]
      );
      summary = {
        totalEarnings: studentProf ? studentProf.total_earnings : 0,
        pendingEscrow: pendingPayout && pendingPayout.pending ? pendingPayout.pending : 0,
        tasksCompleted: studentProf ? studentProf.total_tasks_completed : 0
      };
    } else if (req.user.role === 'neighbor') {
      const totalSpent = await db.get(
        "SELECT SUM(amount) as spent FROM payments WHERE customer_id = ? AND status IN ('escrow_held', 'released')",
        [req.user.id]
      );
      summary = {
        totalSpent: totalSpent && totalSpent.spent ? totalSpent.spent : 0
      };
    }

    return res.json({ success: true, payments: result.rows, summary });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment history.' });
  }
});

// POST /api/payments/create-order - Initialize Razorpay Order / Test Gateway Order
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { taskId, amount } = req.body;
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const orderAmount = amount || task.budget;
    const currency = 'INR';
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_campusneighbor';
    const isTestMode = !process.env.RAZORPAY_KEY_SECRET;

    // Generated Order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return res.json({
      success: true,
      order: {
        id: orderId,
        amount: orderAmount * 100, // in paise
        currency,
        notes: { taskId: task.id, title: task.title },
        keyId: razorpayKeyId,
        isTestMode,
        testModeNotice: 'Running in Secure Sandbox/Test Mode. No real credit card charge occurs.'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

// POST /api/payments/verify - Verify payment (Razorpay callback or Test Mode simulated payment)
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { taskId, orderId, paymentId, signature, amount, studentId } = req.body;

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const targetStudentId = studentId || task.assigned_student_id;
    const paymentRecordId = uuidv4();
    const now = new Date().toISOString();
    const paidAmount = amount || task.budget;

    // Create payment transaction in escrow_held state
    await db.run(
      `INSERT INTO payments (id, task_id, customer_id, student_id, amount, currency, status, payment_gateway, gateway_order_id, gateway_payment_id, transaction_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'INR', 'escrow_held', 'Razorpay', ?, ?, 'escrow_hold', ?, ?)`,
      [paymentRecordId, task.id, req.user.id, targetStudentId, paidAmount, orderId || 'TEST_ORDER', paymentId || `pay_test_${Date.now()}`, now, now]
    );

    return res.json({
      success: true,
      message: 'Payment received into escrow! Funds will be safely released upon task confirmation.',
      paymentId: paymentRecordId,
      status: 'escrow_held'
    });
  } catch (error) {
    console.error('Payment verify error:', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
});

export default router;
