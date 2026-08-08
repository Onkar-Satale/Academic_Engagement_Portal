import { db } from "../config/db.js";

export const PermissionModel = {
  async createRequest({ title, description, event_date, venue, club_id, requester_id }) {
    const [result] = await db.query(
      `INSERT INTO permission_request (title, description, event_date, venue, club_id, requester_id, status, current_level)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 1)`,
      [title, description, event_date, venue, club_id, requester_id]
    );
    return result.insertId;
  },

  async getMyRequests(userId) {
    const [rows] = await db.query(
      `SELECT pr.*, c.name as club_name 
       FROM permission_request pr
       LEFT JOIN club c ON pr.club_id = c.club_id
       WHERE pr.requester_id = ?
       ORDER BY pr.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async getPendingForAuthority(roleId, userId) {
    let query = "";
    let params = [];

    if (roleId === 5) {
      query = `
        SELECT pr.*, c.name as club_name, u.name as requester_name
        FROM permission_request pr
        JOIN club c ON pr.club_id = c.club_id
        JOIN user u ON pr.requester_id = u.user_id
        WHERE pr.current_level = 1 AND pr.status = 'pending' AND c.club_mentor_id = ?
        ORDER BY pr.created_at DESC
      `;
      params = [userId];
    } else if (roleId === 6) {
      query = `
        SELECT pr.*, c.name as club_name, u.name as requester_name
        FROM permission_request pr
        JOIN club c ON pr.club_id = c.club_id
        JOIN user u ON pr.requester_id = u.user_id
        WHERE pr.current_level = 2 AND pr.status = 'pending'
        ORDER BY pr.created_at DESC
      `;
    } else if (roleId === 7) {
      query = `
        SELECT pr.*, c.name as club_name, u.name as requester_name
        FROM permission_request pr
        JOIN club c ON pr.club_id = c.club_id
        JOIN user u ON pr.requester_id = u.user_id
        WHERE pr.current_level = 3 AND pr.status = 'pending'
        ORDER BY pr.created_at DESC
      `;
    } else if (roleId === 8 || roleId === 3 || roleId === 4) {
      query = `
        SELECT pr.*, c.name as club_name, u.name as requester_name
        FROM permission_request pr
        JOIN club c ON pr.club_id = c.club_id
        JOIN user u ON pr.requester_id = u.user_id
        WHERE pr.status = 'pending'
        ORDER BY pr.created_at DESC
      `;
    } else {
      return [];
    }

    const [rows] = await db.query(query, params);
    return rows;
  },

  async updateStatus(requestId, authorityId, level, status, remarks) {
    await db.query(
      `INSERT INTO permission_approval (request_id, authority_id, level, status, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      [requestId, authorityId, level, status, remarks || ""]
    );

    if (status === "rejected") {
      await db.query(
        `UPDATE permission_request SET status = 'rejected' WHERE request_id = ?`,
        [requestId]
      );
    } else if (status === "approved") {
      if (level < 4) {
        await db.query(
          `UPDATE permission_request SET current_level = current_level + 1 WHERE request_id = ?`,
          [requestId]
        );
      } else {
        await db.query(
          `UPDATE permission_request SET status = 'approved' WHERE request_id = ?`,
          [requestId]
        );
      }
    }
  }
};
