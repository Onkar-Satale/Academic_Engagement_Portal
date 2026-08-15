import { db } from "../config/db.js";

export const ClubModel = {
  create: async ({ name, description, club_head_id, club_mentor_id, club_head_key, permission_emails, club_mentor_key }) => {
    const [res] = await db.query(
      "INSERT INTO club (name, description, club_head_id, club_mentor_id, club_head_key, permission_emails, club_mentor_key) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, description, club_head_id || null, club_mentor_id || null, club_head_key || null, permission_emails || null, club_mentor_key || null]
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
        (SELECT COUNT(*) FROM club_member cm WHERE cm.club_id = c.club_id AND cm.status = 'approved') as active_members
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
          (SELECT COUNT(*) FROM club_member cm WHERE cm.club_id = c.club_id AND cm.status = 'approved') as active_members
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
      "SELECT * FROM club WHERE club_head_key = ? OR club_mentor_key = ?",
      [key, key]
    );
    return clubs[0];
  },

  revokeClubKey: async (key) => {
    const [res] = await db.query(
      `UPDATE club 
       SET club_head_key = CASE WHEN club_head_key = ? THEN NULL ELSE club_head_key END,
           club_mentor_key = CASE WHEN club_mentor_key = ? THEN NULL ELSE club_mentor_key END
       WHERE club_head_key = ? OR club_mentor_key = ?`,
      [key, key, key, key]
    );
    return res.affectedRows > 0;
  },

  setClubKey: async (clubId, keyType, secretKey) => {
    const column = keyType === "mentor" ? "club_mentor_key" : "club_head_key";
    const [res] = await db.query(
      `UPDATE club SET ${column} = ? WHERE club_id = ?`,
      [secretKey, clubId]
    );
    return res.affectedRows > 0;
  },

  revokeClubKeyByType: async (clubId, keyType) => {
    const column = keyType === "mentor" ? "club_mentor_key" : "club_head_key";
    const [res] = await db.query(
      `UPDATE club SET ${column} = NULL WHERE club_id = ?`,
      [clubId]
    );
    return res.affectedRows > 0;
  },

  assignHead: async (clubKey, userId) => {
    await db.query(
      "UPDATE club SET club_head_id = ? WHERE club_head_key = ?",
      [userId, clubKey]
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
    const { name, description, tagline, category, activities, club_head_id, club_mentor_id, permission_emails } = data;
    const [result] = await db.query(
      `UPDATE club 
     SET name = ?, description = ?, tagline = ?, category = ?, activities = ?, club_head_id = ?, club_mentor_id = ?, permission_emails = ?
     WHERE club_id = ?`,
      [name, description, tagline, category, activities, club_head_id, club_mentor_id, permission_emails || null, clubId]
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
