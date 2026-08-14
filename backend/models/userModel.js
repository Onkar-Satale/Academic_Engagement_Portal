import { db } from "../config/db.js";
import bcrypt from "bcrypt";

export const UserModel = {
  findByEmail: async (email) => {
    const [[row]] = await db.query(
      "SELECT u.*, r.role_name FROM user u JOIN role r ON u.role_id = r.role_id WHERE u.email = ?",
      [email]
    );
    return row;
  },

  findById: async (userId) => {
    const [[row]] = await db.query(
      "SELECT u.*, r.role_name FROM user u JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?",
      [userId]
    );
    return row;
  },

  create: async (data) => {
    const { name, email, password, password_hash, department, year, role_id } = data;
    const finalHash = password_hash || (password ? await bcrypt.hash(password, 10) : "");
    const [res] = await db.query(
      `INSERT INTO user (name, email, password_hash, department, year, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, finalHash, department || null, year || null, role_id]
    );
    return res.insertId;
  },

  verifyPassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  getRoleById: async (role_id) => {
    const [rows] = await db.query(
      "SELECT role_name FROM role WHERE role_id = ?",
      [role_id]
    );
    return rows[0];
  },

  updateRole: async (userId, roleId) => {
    const [res] = await db.query(
      "UPDATE user SET role_id = ? WHERE user_id = ?",
      [roleId, userId]
    );
    return res.affectedRows > 0;
  },

  delete: async (userId) => {
    // 1. Unlink user if assigned as club head or mentor
    await db.query("UPDATE club SET club_head_id = NULL WHERE club_head_id = ?", [userId]);
    await db.query("UPDATE club SET club_mentor_id = NULL WHERE club_mentor_id = ?", [userId]);

    // 2. Unlink user if assigned as event organizer
    await db.query("UPDATE event SET organizer_id = NULL WHERE organizer_id = ?", [userId]);

    // 3. Delete dependent rows across all relational tables
    await db.query("DELETE FROM club_member WHERE user_id = ?", [userId]);
    await db.query("DELETE FROM event_registration WHERE student_id = ?", [userId]);
    await db.query("DELETE FROM volunteer WHERE student_id = ?", [userId]);
    await db.query("DELETE FROM notification WHERE user_id = ?", [userId]);
    await db.query("DELETE FROM permission_approval WHERE authority_id = ?", [userId]);
    await db.query("DELETE FROM permission_request WHERE requester_id = ?", [userId]);

    // 4. Delete the user
    const [res] = await db.query("DELETE FROM user WHERE user_id = ?", [userId]);
    return res.affectedRows > 0;
  }
};
