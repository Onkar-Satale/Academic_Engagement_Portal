import { db } from "../config/db.js";

export const ClubModel = {
  create: async ({ name, description, club_head_id, club_mentor_id, tagline, category, activities, permission_emails }) => {
    const sanitizeId = (val) => {
      if (val === "" || val === null || val === undefined || val === "null" || isNaN(Number(val))) {
        return null;
      }
      return Number(val);
    };

    const [res] = await db.query(
      "INSERT INTO club (name, description, club_head_id, club_mentor_id, tagline, category, activities, permission_emails) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        description,
        sanitizeId(club_head_id),
        sanitizeId(club_mentor_id),
        tagline || null,
        category || null,
        activities || null,
        permission_emails || null
      ]
    );
    return res.insertId;
  },

  getCandidates: async () => {
    // Students: Active Student or Club Head (excludes Passout/Graduated)
    const [students] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.department, u.year, u.role_id, r.role_name
      FROM user u
      JOIN role r ON u.role_id = r.role_id
      WHERE r.role_name IN ('Student', 'Club Head')
        AND COALESCE(u.is_passout, 0) = 0
      ORDER BY u.name ASC
    `);

    // Common Teachers: Active Teacher or Club Mentor (excludes Retired faculty & Institutional heads)
    const [teachers] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.department, u.year, u.role_id, r.role_name
      FROM user u
      JOIN role r ON u.role_id = r.role_id
      WHERE r.role_name IN ('Teacher', 'Club Mentor')
        AND COALESCE(u.is_retired, 0) = 0
      ORDER BY u.name ASC
    `);

    return { students, teachers };
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

  findByUserRole: async (userId) => {
    const [[headClub]] = await db.query("SELECT club_id FROM club WHERE club_head_id = ?", [userId]);
    if (headClub) return headClub.club_id;
    const [[mentorClub]] = await db.query("SELECT club_id FROM club WHERE club_mentor_id = ?", [userId]);
    if (mentorClub) return mentorClub.club_id;
    return null;
  },

  countOtherClubsForHead: async (userId, excludeClubId) => {
    const [[row]] = await db.query(
      "SELECT COUNT(*) as count FROM club WHERE club_head_id = ? AND club_id != ?",
      [userId, excludeClubId]
    );
    return row?.count || 0;
  },

  countOtherClubsForMentor: async (userId, excludeClubId) => {
    const [[row]] = await db.query(
      "SELECT COUNT(*) as count FROM club WHERE club_mentor_id = ? AND club_id != ?",
      [userId, excludeClubId]
    );
    return row?.count || 0;
  },

  clearHead: async (userId) => {
    await db.query("UPDATE club SET club_head_id = NULL WHERE club_head_id = ?", [userId]);
  },

  clearMentor: async (userId) => {
    await db.query("UPDATE club SET club_mentor_id = NULL WHERE club_mentor_id = ?", [userId]);
  },

  syncOrphanedLeaders: async () => {
    try {
      // 1. Demote any Club Head (role_id 4) who is not an active head of any club to Student (role_id 1)
      await db.query(`
        UPDATE user 
        SET role_id = 1 
        WHERE role_id = 4 
          AND user_id NOT IN (SELECT club_head_id FROM club WHERE club_head_id IS NOT NULL)
      `);

      // 2. Demote any Club Mentor (role_id 5) who is not an active mentor of any club to Teacher (role_id 2)
      await db.query(`
        UPDATE user 
        SET role_id = 2 
        WHERE role_id = 5 
          AND user_id NOT IN (SELECT club_mentor_id FROM club WHERE club_mentor_id IS NOT NULL)
      `);
    } catch (err) {
      console.warn("syncOrphanedLeaders warning in ClubModel:", err);
    }
  },

  update: async (clubId, data) => {
    const { name, description, tagline, category, activities, club_head_id, club_mentor_id, permission_emails } = data;
    
    const sanitizeId = (val) => {
      if (val === "" || val === null || val === undefined || val === "null" || isNaN(Number(val))) {
        return null;
      }
      return Number(val);
    };

    const [result] = await db.query(
      `UPDATE club 
     SET name = ?, description = ?, tagline = ?, category = ?, activities = ?, club_head_id = ?, club_mentor_id = ?, permission_emails = ?
     WHERE club_id = ?`,
      [
        name,
        description,
        tagline || null,
        category || null,
        activities || null,
        sanitizeId(club_head_id),
        sanitizeId(club_mentor_id),
        permission_emails || null,
        clubId
      ]
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
  },

  findActiveClubByHead: async (userId) => {
    const [[club]] = await db.query(
      "SELECT club_id, name FROM club WHERE club_head_id = ?",
      [userId]
    );
    return club || null;
  },

  findActiveClubByMentor: async (userId) => {
    const [[club]] = await db.query(
      "SELECT club_id, name FROM club WHERE club_mentor_id = ?",
      [userId]
    );
    return club || null;
  },

  findActiveHeadsInYear: async (year = 4, department = null) => {
    let query = `
      SELECT u.user_id, u.name, u.email, u.department, u.year, c.club_id, c.name as club_name
      FROM user u
      JOIN club c ON c.club_head_id = u.user_id
      WHERE u.year = ? AND COALESCE(u.is_passout, 0) = 0
    `;
    const params = [year];
    if (department && department !== "all") {
      query += " AND u.department = ?";
      params.push(department);
    }
    const [rows] = await db.query(query, params);
    return rows;
  }
};
