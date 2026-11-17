import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';
import { createNotification } from '../utils/helpers.js';

const router = express.Router();

// GET /api/messages/conversations - List all conversations for current user
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const convs = await db.query(
      `SELECT c.*,
              t.title as task_title, t.status as task_status, t.budget as task_budget,
              cust.full_name as customer_name, cust.avatar_url as customer_avatar,
              stud.full_name as student_name, stud.avatar_url as student_avatar,
              (SELECT message_text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_text,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.is_read = 0) as unread_count
       FROM conversations c
       JOIN tasks t ON c.task_id = t.id
       JOIN users cust ON c.customer_id = cust.id
       JOIN users stud ON c.student_id = stud.id
       WHERE c.customer_id = ? OR c.student_id = ?
       ORDER BY c.last_message_at DESC`,
      [req.user.id, req.user.id, req.user.id]
    );

    // Format for current user perspective
    const formatted = convs.rows.map(c => {
      const otherUser = req.user.id === c.customer_id
        ? { id: c.student_id, name: c.student_name, avatar: c.student_avatar, role: 'Student Helper' }
        : { id: c.customer_id, name: c.customer_name, avatar: c.customer_avatar, role: 'Neighbor' };
      return {
        id: c.id,
        taskId: c.task_id,
        taskTitle: c.task_title,
        taskStatus: c.task_status,
        taskBudget: c.task_budget,
        otherUser,
        lastMessageText: c.last_message_text || 'Conversation started',
        lastMessageAt: c.last_message_at,
        unreadCount: c.unread_count || 0
      };
    });

    return res.json({ success: true, conversations: formatted });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch conversations.' });
  }
});

// GET /api/messages/conversation/:id - Get messages for conversation
router.get('/conversation/:id', requireAuth, async (req, res) => {
  try {
    const conv = await db.get(
      `SELECT c.*, t.title as task_title, t.status as task_status,
              cust.full_name as customer_name, stud.full_name as student_name
       FROM conversations c
       JOIN tasks t ON c.task_id = t.id
       JOIN users cust ON c.customer_id = cust.id
       JOIN users stud ON c.student_id = stud.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    if (conv.customer_id !== req.user.id && conv.student_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Mark messages as read
    await db.run(
      'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?',
      [conv.id, req.user.id]
    );

    const msgs = await db.query(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conv.id]
    );

    return res.json({ success: true, conversation: conv, messages: msgs.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
});

// POST /api/messages - Send a message
router.post('/', requireAuth, async (req, res) => {
  try {
    const { conversationId, taskId, recipientId, messageText } = req.body;

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    let convId = conversationId;
    let conv = null;

    if (convId) {
      conv = await db.get('SELECT * FROM conversations WHERE id = ?', [convId]);
    } else if (taskId && recipientId) {
      conv = await db.get(
        'SELECT * FROM conversations WHERE task_id = ? AND ((customer_id = ? AND student_id = ?) OR (customer_id = ? AND student_id = ?))',
        [taskId, req.user.id, recipientId, recipientId, req.user.id]
      );
      if (conv) convId = conv.id;
    }

    if (!conv && taskId && recipientId) {
      // Create new conversation
      convId = uuidv4();
      const now = new Date().toISOString();
      const task = await db.get('SELECT customer_id FROM tasks WHERE id = ?', [taskId]);
      const customerId = task ? task.customer_id : req.user.id;
      const studentId = customerId === req.user.id ? recipientId : req.user.id;

      await db.run(
        `INSERT INTO conversations (id, task_id, customer_id, student_id, last_message_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [convId, taskId, customerId, studentId, now, now]
      );
      conv = { id: convId, task_id: taskId, customer_id: customerId, student_id: studentId };
    }

    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found or cannot be created.' });
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO messages (id, conversation_id, sender_id, message_text, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [messageId, convId, req.user.id, messageText.trim(), now]
    );

    await db.run('UPDATE conversations SET last_message_at = ? WHERE id = ?', [now, convId]);

    const createdMsg = {
      id: messageId,
      conversation_id: convId,
      sender_id: req.user.id,
      sender_name: req.user.full_name,
      sender_avatar: req.user.avatar_url,
      message_text: messageText.trim(),
      is_read: 0,
      created_at: now
    };

    // Real-time socket dispatch
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${convId}`).emit('new_message', createdMsg);
      const recipientUser = req.user.id === conv.customer_id ? conv.student_id : conv.customer_id;
      io.to(`user:${recipientUser}`).emit('message_notification', {
        conversationId: convId,
        senderName: req.user.full_name,
        messageText: messageText.trim()
      });
    }

    return res.status(201).json({ success: true, message: createdMsg });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

export default router;
