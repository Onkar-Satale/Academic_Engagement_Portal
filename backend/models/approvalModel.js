import { db } from "../config/db.js";

export const ApprovalModel = {
  create: async (eventId, authorityId, status, remarks) => {
    const [res] = await db.query(
      `INSERT INTO approval (event_id, authority_id, status, remarks)
       VALUES (?, ?, ?, ?)`,
      [eventId, authorityId, status, remarks]
    );
    return res.insertId;
  },

  createWithEventUpdate: async (eventId, authorityId, status, remarks) => {
    await db.query(
      "INSERT INTO approval (event_id, authority_id, status, remarks, action_date) VALUES (?, ?, ?, ?, NOW())",
      [eventId, authorityId, status, remarks]
    );
    await db.query("UPDATE event SET status = ? WHERE event_id = ?", [status, eventId]);
  },

  getByEvent: async (eventId) => {
    const [rows] = await db.query(
      "SELECT * FROM approval WHERE event_id = ?",
      [eventId]
    );
    return rows;
  }
};

export default ApprovalModel;
