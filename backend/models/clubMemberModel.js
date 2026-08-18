import { db } from "../config/db.js";

export const ClubMemberModel = {
  join: async (club_id, user_id, reason) => {
    const [[userRow]] = await db.query("SELECT is_passout FROM user WHERE user_id = ?", [user_id]);
    if (userRow && (userRow.is_passout === 1 || userRow.is_passout === true)) {
      const err = new Error("Passout alumni accounts cannot submit join requests for student clubs.");
      err.statusCode = 403;
      throw err;
    }

    const [[existing]] = await db.query(
      "SELECT status FROM club_member WHERE club_id = ? AND user_id = ?",
      [club_id, user_id]
    );

    if (existing) {
      if (existing.status === 'approved') {
        const err = new Error("You are already an approved member of this club!");
        err.statusCode = 400;
        throw err;
      }
      if (existing.status === 'pending') {
        const err = new Error("You have already submitted an application for this club. Please wait for the Club Head/Mentor to review.");
        err.statusCode = 400;
        throw err;
      }
    }

    await db.query(
      "INSERT INTO club_member (club_id, user_id, status, reason) VALUES (?, ?, 'pending', ?)",
      [club_id, user_id, reason || null]
    );
  },

  addApprovedMember: async (club_id, user_id) => {
    await db.query(
      "INSERT IGNORE INTO club_member (club_id, user_id, status) VALUES (?, ?, 'approved')",
      [club_id, user_id]
    );
  },

  leave: async (club_id, user_id) => {
    await db.query(
      `DELETE FROM club_member WHERE club_id = ? AND user_id = ?`,
      [club_id, user_id]
    );
  },

  getEnrolledClubs: async (userId) => {
    const [rows] = await db.query(
      "SELECT DISTINCT club_id FROM club_member WHERE user_id = ? AND (status = 'approved' OR status = 'pending')",
      [userId]
    );
    return rows.map(r => r.club_id);
  },

  getClubMembers: async (clubId) => {
    const [members] = await db.query(
      `SELECT cm.user_id, cm.status, u.name as student_name, u.email, u.year, u.department as branch
       FROM club_member cm
       JOIN user u ON cm.user_id = u.user_id
       WHERE cm.club_id = ? AND cm.status = 'approved'`,
      [clubId]
    );
    return members;
  },

  getPendingApplications: async (clubId) => {
    const [rows] = await db.query(
      `SELECT cm.club_id, cm.user_id, cm.status, cm.reason, cm.joined_at, u.name, u.email, u.department, u.year
       FROM club_member cm
       JOIN user u ON cm.user_id = u.user_id
       WHERE cm.club_id = ? AND cm.status = 'pending'
       ORDER BY cm.joined_at DESC`,
      [clubId]
    );
    return rows;
  },

  updateApplicationStatus: async (clubId, userId, status) => {
    const [res] = await db.query(
      "UPDATE club_member SET status = ? WHERE club_id = ? AND user_id = ?",
      [status, clubId, userId]
    );
    return res.affectedRows > 0;
  },

  getMemberStatus: async (clubId, userId) => {
    const [[row]] = await db.query(
      "SELECT status FROM club_member WHERE club_id = ? AND user_id = ?",
      [clubId, userId]
    );
    return row ? row.status : null;
  },

  addStudent: async (clubId, studentData) => {
    const { name, email, roll_no, year, branch } = studentData;
    let [users] = await db.query("SELECT user_id FROM user WHERE email = ?", [email]);
    let studentId;

    if (!users.length) {
      const [userRes] = await db.query(
        "INSERT INTO user (name, email, department, year, role_id) VALUES (?, ?, ?, ?, 1)",
        [name, email, branch || null, year || null]
      );
      studentId = userRes.insertId;
    } else {
      studentId = users[0].user_id;
    }

    const [exists] = await db.query(
      "SELECT 1 FROM club_member WHERE club_id = ? AND user_id = ?",
      [clubId, studentId]
    );
    if (exists.length) return false;

    await db.query(
      "INSERT INTO club_member (club_id, user_id, status) VALUES (?, ?, 'approved')",
      [clubId, studentId]
    );
    return true;
  },

  removeStudent: async (clubId, email) => {
    const [result] = await db.query(
      `DELETE cm FROM club_member cm
       JOIN user u ON cm.user_id = u.user_id
       WHERE cm.club_id = ? AND u.email = ?`,
      [clubId, email]
    );
    return result.affectedRows > 0;
  },

  getUserAssociatedClubs: async (userId, userRole) => {
    let query;
    let params;

    if (userRole === 1) {
      query = `
        SELECT DISTINCT 
          c.*,
          mentor.name as mentor_name,
          mentor.email as mentor_email,
          head.name as head_name,
          head.email as head_email
        FROM club c
        INNER JOIN club_member cm ON cm.club_id = c.club_id
        LEFT JOIN user mentor ON c.club_mentor_id = mentor.user_id
        LEFT JOIN user head ON c.club_head_id = head.user_id
        WHERE cm.user_id = ? AND cm.status = 'approved'
      `;
      params = [userId];
    } else {
      query = `
        SELECT DISTINCT 
          c.*,
          mentor.name as mentor_name,
          mentor.email as mentor_email,
          head.name as head_name,
          head.email as head_email
        FROM club c
        LEFT JOIN club_member cm ON cm.club_id = c.club_id AND cm.user_id = ?
        LEFT JOIN user mentor ON c.club_mentor_id = mentor.user_id
        LEFT JOIN user head ON c.club_head_id = head.user_id
        WHERE (cm.user_id = ? AND cm.status = 'approved') OR c.club_head_id = ? OR c.club_mentor_id = ?
      `;
      params = [userId, userId, userId, userId];
    }

    const [clubs] = await db.query(query, params);
    return clubs;
  },

  expressInterest: async (userId, clubId) => {
    await db.query("INSERT INTO club_interest (user_id, club_id) VALUES (?, ?)", [userId, clubId]);
  },

  getUserInterests: async (userId) => {
    const [rows] = await db.query(
      "SELECT ci.*, c.name as club_name FROM club_interest ci JOIN club c ON ci.club_id = c.club_id WHERE ci.user_id = ?",
      [userId]
    );
    return rows;
  }
};
