import { db } from "../config/db.js";

export const NotificationModel = {
  async getUserNotifications(userId) {
    const [rows] = await db.query(
      "SELECT * FROM notification WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    return rows;
  },

  async markAsRead(notificationId, userId) {
    await db.query(
      "UPDATE notification SET is_read = TRUE WHERE notification_id = ? AND user_id = ?",
      [notificationId, userId]
    );
  },

  async createNotification(data) {
    const { user_id, title, message, type, link } = data;
    await db.query(
      "INSERT INTO notification (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)",
      [user_id, title, message, type || 'info', link || null]
    );
  }
};

export default NotificationModel;
