import { db } from "../config/db.js";

const levelRoleMap = {
  1: "Club Mentor",
  2: "Estate Manager",
  3: "Principal"
};

export const PermissionModel = {
  async createRequest({ title, description, event_date, venue, club_id, requester_id }) {
    const [result] = await db.query(
      `INSERT INTO permission_request (title, description, event_date, venue, club_id, requester_id, status, current_level)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 1)`,
      [title, description, event_date, venue, club_id, requester_id]
    );
    return result.insertId;
  },

  async getByIdWithDetails(requestId) {
    const [[row]] = await db.query(
      `SELECT pr.*, c.name as club_name 
       FROM permission_request pr 
       JOIN club c ON pr.club_id = c.club_id 
       WHERE pr.request_id = ?`,
      [requestId]
    );
    return row;
  },

  async getMyRequests(userId) {
    const [rows] = await db.query(
      `SELECT pr.*, c.name as club_name 
       FROM permission_request pr
       LEFT JOIN club c ON pr.club_id = c.club_id
       WHERE pr.requester_id = ? OR c.club_head_id = ?
       ORDER BY pr.created_at DESC`,
      [userId, userId]
    );

    for (const req of rows) {
      const [approvals] = await db.query(
        `SELECT pa.*, u.name as authority_name, u.email as authority_email, r.role_name as authority_current_role
         FROM permission_approval pa
         JOIN user u ON pa.authority_id = u.user_id
         JOIN role r ON u.role_id = r.role_id
         WHERE pa.request_id = ?
         ORDER BY pa.level ASC`,
        [req.request_id]
      );
      req.approval_history = (approvals || []).map((pa) => ({
        ...pa,
        authority_stage_title: levelRoleMap[pa.level] || "Authority"
      }));
    }

    return rows;
  },

  async getPendingForAuthority(roleId, userId) {
    let query = "";
    let params = [];

    if (roleId === 5) {
      // Level 1: Club Mentor for their specific club
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
      // Level 2: Estate Manager
      query = `
        SELECT pr.*, c.name as club_name, u.name as requester_name
        FROM permission_request pr
        JOIN club c ON pr.club_id = c.club_id
        JOIN user u ON pr.requester_id = u.user_id
        WHERE pr.current_level = 2 AND pr.status = 'pending'
        ORDER BY pr.created_at DESC
      `;
    } else if (roleId === 7) {
      // Level 3: Principal
      query = `
        SELECT pr.*, c.name as club_name, u.name as requester_name
        FROM permission_request pr
        JOIN club c ON pr.club_id = c.club_id
        JOIN user u ON pr.requester_id = u.user_id
        WHERE pr.current_level = 3 AND pr.status = 'pending'
        ORDER BY pr.created_at DESC
      `;
    } else if (roleId === 3) {
      // Admin overview
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

    for (const req of rows) {
      const [approvals] = await db.query(
        `SELECT pa.*, u.name as authority_name, u.email as authority_email, r.role_name as authority_current_role
         FROM permission_approval pa
         JOIN user u ON pa.authority_id = u.user_id
         JOIN role r ON u.role_id = r.role_id
         WHERE pa.request_id = ?
         ORDER BY pa.level ASC`,
        [req.request_id]
      );
      req.approval_history = (approvals || []).map((pa) => ({
        ...pa,
        authority_stage_title: levelRoleMap[pa.level] || "Authority"
      }));
    }

    return rows;
  },

  async getDecisionsByAuthority(userId) {
    const [rows] = await db.query(
      `SELECT pa.*, pr.title as request_title, pr.event_date, pr.venue, pr.status as final_request_status,
              c.name as club_name, u.name as requester_name
       FROM permission_approval pa
       JOIN permission_request pr ON pa.request_id = pr.request_id
       JOIN club c ON pr.club_id = c.club_id
       JOIN user u ON pr.requester_id = u.user_id
       WHERE pa.authority_id = ?
       ORDER BY pa.action_date DESC`,
      [userId]
    );
    return rows.map((r) => ({
      ...r,
      authority_stage_title: levelRoleMap[r.level] || "Authority"
    }));
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
      if (level < 3) {
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
  },

  async deleteByRequester(requestId, requesterId) {
    await db.query(
      "DELETE FROM permission_request WHERE request_id = ? AND requester_id = ?",
      [requestId, requesterId]
    );
  },

  async getDistinctReviewers(requestId) {
    const [rows] = await db.query(
      "SELECT DISTINCT authority_id FROM permission_approval WHERE request_id = ?",
      [requestId]
    );
    return rows.map(r => r.authority_id);
  },

  async delete(requestId) {
    await db.query("DELETE FROM permission_request WHERE request_id = ?", [requestId]);
  }
};
