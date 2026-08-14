import { db } from "../config/db.js";

export const FeedbackModel = {
  create: async ({ user_id, message, rating }) => {
    const [res] = await db.query(
      "INSERT INTO feedback (user_id, message, rating) VALUES (?, ?, ?)",
      [user_id, message, rating || 5]
    );
    return res.insertId;
  },

  getAll: async () => {
    const [rows] = await db.query(`
      SELECT 
        f.*,
        u.name as user_name,
        u.email as user_email,
        u.department,
        u.year,
        r.role_name
      FROM feedback f
      JOIN user u ON f.user_id = u.user_id
      JOIN role r ON u.role_id = r.role_id
      ORDER BY f.created_at DESC
    `);
    return rows;
  },
  findById: async (id) => {
    const [[row]] = await db.query(
      "SELECT * FROM feedback WHERE feedback_id = ?",
      [id]
    );
    return row;
  },

  delete: async (id) => {
    const [res] = await db.query(
      "DELETE FROM feedback WHERE feedback_id = ?",
      [id]
    );
    return res.affectedRows > 0;
  }
};
