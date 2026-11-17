import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';

/**
 * Calculate distance between two lat/lon coordinates using the Haversine formula (km)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Create a persistent notification in DB and broadcast via Socket.IO if user is connected
 */
export async function createNotification(userId, title, message, type, linkUrl = null, io = null) {
  try {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    await db.run(
      `INSERT INTO notifications (id, user_id, title, message, type, link_url, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, userId, title, message, type, linkUrl, createdAt]
    );

    const notification = {
      id,
      user_id: userId,
      title,
      message,
      type,
      link_url: linkUrl,
      is_read: 0,
      created_at: createdAt
    };

    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}
