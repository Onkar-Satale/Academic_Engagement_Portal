import { db } from "../config/db.js";

export const ClubModel = {
  create: async ({ name, description, club_head_id, club_mentor_id, secret_key, permission_emails, club_mentor_key }) => {
    const [res] = await db.query(
      "INSERT INTO club (name, description, club_head_id, club_mentor_id, secret_key, permission_emails, club_mentor_key) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, description, club_head_id, club_mentor_id, secret_key, permission_emails || null, club_mentor_key || null]
    );
    return res.insertId;
  },

  getAllWithDetails: async () => {
    const [clubs] = await db.query(`
      SELECT 
        c.*,
        mentor.name as mentor_name,
        mentor.email as mentor_email,
        head.name as head_name,
        head.email as head_email,
        (SELECT COUNT(*) FROM club_member cm WHERE cm.club_id = c.club_id) + 1 as active_members
      FROM club c
      LEFT JOIN user mentor ON c.club_mentor_id = mentor.user_id
      LEFT JOIN user head ON c.club_head_id = head.user_id
    `);
    return clubs;
  },

  getByIdWithDetails: async (clubId) => {
    const [rows] = await db.query(
      `SELECT 
          c.*,
          mentor.name as mentor_name,
          mentor.email as mentor_email,
          head.name as head_name,
          head.email as head_email,
          (SELECT COUNT(*) FROM club_member cm WHERE cm.club_id = c.club_id) + 1 as active_members
       FROM club c
       LEFT JOIN user mentor ON c.club_mentor_id = mentor.user_id
       LEFT JOIN user head ON c.club_head_id = head.user_id
       WHERE c.club_id = ?`,
      [clubId]
    );
    return rows[0];
  },

  findByKey: async (key) => {
    const [clubs] = await db.query(
      "SELECT * FROM club WHERE club_head_key = ? OR secret_key = ? OR club_mentor_key = ?",
      [key, key, key]
    );
    return clubs[0];
  },

  assignHead: async (clubKey, userId) => {
    await db.query(
      "UPDATE club SET club_head_id = ? WHERE club_head_key = ? OR secret_key = ?",
      [userId, clubKey, clubKey]
    );
    const [[c]] = await db.query("SELECT club_id FROM club WHERE club_head_id = ?", [userId]);
    return c ? c.club_id : null;
  },

  assignMentor: async (mentorKey, userId) => {
    await db.query(
      "UPDATE club SET club_mentor_id = ? WHERE club_mentor_key = ?",
      [userId, mentorKey]
    );
    const [[c]] = await db.query("SELECT club_id FROM club WHERE club_mentor_id = ?", [userId]);
    return c ? c.club_id : null;
  },

  findByUserRole: async (userId) => {
    const [[headClub]] = await db.query("SELECT club_id FROM club WHERE club_head_id = ?", [userId]);
    if (headClub) return headClub.club_id;
    const [[mentorClub]] = await db.query("SELECT club_id FROM club WHERE club_mentor_id = ?", [userId]);
    if (mentorClub) return mentorClub.club_id;
    return null;
  },

  update: async (clubId, data) => {
    const { name, description, secret_key, tagline, category, activities, club_head_id, club_mentor_id, permission_emails } = data;
    const [result] = await db.query(
      `UPDATE club 
     SET name = ?, description = ?, secret_key = ?, tagline = ?, category = ?, activities = ?, club_head_id = ?, club_mentor_id = ?, permission_emails = ?
     WHERE club_id = ?`,
      [name, description, secret_key, tagline, category, activities, club_head_id, club_mentor_id, permission_emails || null, clubId]
    );
    return result;
  },

  delete: async (clubId) => {
    await db.query("DELETE FROM club_member WHERE club_id = ?", [clubId]);
    await db.query("DELETE FROM club WHERE club_id = ?", [clubId]);
  },

  updateRegistrationStatus: async (clubId, is_registration_open) => {
    const [result] = await db.query(
      `UPDATE club SET is_registration_open = ? WHERE club_id = ?`,
      [is_registration_open, clubId]
    );
    return result;
  }
};

export default ClubModel;
