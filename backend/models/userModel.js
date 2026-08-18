import { db } from "../config/db.js";
import bcrypt from "bcrypt";

// Ensure is_active, is_retired, and is_passout columns exist
export const initUserTable = async () => {
  try {
    const [colsActive] = await db.query("SHOW COLUMNS FROM user LIKE 'is_active'");
    if (colsActive.length === 0) {
      await db.query("ALTER TABLE user ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
    }
    const [colsRetired] = await db.query("SHOW COLUMNS FROM user LIKE 'is_retired'");
    if (colsRetired.length === 0) {
      await db.query("ALTER TABLE user ADD COLUMN is_retired BOOLEAN DEFAULT FALSE");
    }
    const [colsPassout] = await db.query("SHOW COLUMNS FROM user LIKE 'is_passout'");
    if (colsPassout.length === 0) {
      await db.query("ALTER TABLE user ADD COLUMN is_passout BOOLEAN DEFAULT FALSE");
    }
  } catch (err) {
    console.warn("user table init warning:", err.message);
  }
};
initUserTable();

export const UserModel = {
  findByEmail: async (email) => {
    const [[row]] = await db.query(
      "SELECT u.*, r.role_name FROM user u LEFT JOIN role r ON u.role_id = r.role_id WHERE u.email = ?",
      [email]
    );
    return row;
  },

  findById: async (userId) => {
    const [[row]] = await db.query(
      "SELECT u.*, r.role_name FROM user u LEFT JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?",
      [userId]
    );
    return row;
  },

  findByRoleId: async (roleId) => {
    const [rows] = await db.query(
      "SELECT user_id, name, email, department, year, role_id, is_active, is_retired, is_passout FROM user WHERE role_id = ?",
      [roleId]
    );
    return rows;
  },

  getAllUsers: async () => {
    const [rows] = await db.query(
      `SELECT u.user_id, u.name, u.email, u.department, u.year, u.role_id, r.role_name, u.profile_photo, 
              COALESCE(u.is_active, 1) as is_active, 
              COALESCE(u.is_retired, 0) as is_retired,
              COALESCE(u.is_passout, 0) as is_passout
       FROM user u
       LEFT JOIN role r ON u.role_id = r.role_id
       ORDER BY u.role_id ASC, u.name ASC`
    );
    return rows;
  },

  create: async (data) => {
    const { name, email, password, password_hash, department, year, role_id } = data;
    const finalHash = password_hash || (password ? await bcrypt.hash(password, 10) : "");
    const [res] = await db.query(
      `INSERT INTO user (name, email, password_hash, department, year, role_id, is_active, is_retired, is_passout)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, FALSE, FALSE)`,
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

  toggleActiveStatus: async (userId) => {
    await db.query(
      "UPDATE user SET is_active = CASE WHEN COALESCE(is_active, 1) = 1 THEN 0 ELSE 1 END WHERE user_id = ?",
      [userId]
    );
    const [[updated]] = await db.query(
      "SELECT u.user_id, u.name, u.email, u.is_active, u.is_retired, u.is_passout, r.role_name FROM user u LEFT JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?",
      [userId]
    );
    return updated;
  },

  toggleRetiredStatus: async (userId) => {
    const [[currentUser]] = await db.query(
      "SELECT user_id, role_id, is_retired FROM user WHERE user_id = ?",
      [userId]
    );

    const willBeRetired = currentUser ? (currentUser.is_retired ? 0 : 1) : 1;

    await db.query(
      "UPDATE user SET is_retired = ? WHERE user_id = ?",
      [willBeRetired, userId]
    );

    const [[updated]] = await db.query(
      "SELECT u.user_id, u.name, u.email, u.is_active, u.is_retired, u.is_passout, u.role_id, r.role_name FROM user u LEFT JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?",
      [userId]
    );
    return updated;
  },

  togglePassoutStatus: async (userId) => {
    const [[currentUser]] = await db.query(
      "SELECT u.user_id, u.role_id, u.is_passout, r.role_name FROM user u LEFT JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?",
      [userId]
    );

    const willBePassout = currentUser ? (currentUser.is_passout ? 0 : 1) : 1;

    await db.query(
      "UPDATE user SET is_passout = ? WHERE user_id = ?",
      [willBePassout, userId]
    );

    const [[updated]] = await db.query(
      "SELECT u.user_id, u.name, u.email, u.is_active, u.is_retired, u.is_passout, u.role_id, r.role_name FROM user u LEFT JOIN role r ON u.role_id = r.role_id WHERE u.user_id = ?",
      [userId]
    );
    return updated;
  },

  batchGraduateFinalYear: async (department = null) => {
    let query = `
      UPDATE user u
      JOIN role r ON u.role_id = r.role_id
      SET u.is_passout = 1
      WHERE r.role_name IN ('Student', 'Club Head')
        AND u.year = 4
        AND COALESCE(u.is_passout, 0) = 0
    `;
    const params = [];
    if (department && department !== "all") {
      query += " AND u.department = ?";
      params.push(department);
    }

    const [res] = await db.query(query, params);

    // Unassign any graduated Club Heads from clubs
    await db.query(`
      UPDATE club c
      JOIN user u ON c.club_head_id = u.user_id
      SET c.club_head_id = NULL
      WHERE u.is_passout = 1
    `);

    // Demote graduated Club Heads to Student role
    const [[studentRole]] = await db.query("SELECT role_id FROM role WHERE role_name = 'Student'");
    if (studentRole) {
      await db.query(`
        UPDATE user u
        JOIN role r ON u.role_id = r.role_id
        SET u.role_id = ?
        WHERE r.role_name = 'Club Head' AND u.is_passout = 1
      `, [studentRole.role_id]);
    }

    return res.affectedRows;
  },

  batchPromoteAcademicYears: async () => {
    // 1. Mark Year 4 students as passout/graduated
    const [gradRes] = await db.query(`
      UPDATE user u
      JOIN role r ON u.role_id = r.role_id
      SET u.is_passout = 1
      WHERE r.role_name IN ('Student', 'Club Head')
        AND u.year = 4
        AND COALESCE(u.is_passout, 0) = 0
    `);

    // 2. Promote Year 3 -> Year 4
    const [p3] = await db.query(`
      UPDATE user u
      JOIN role r ON u.role_id = r.role_id
      SET u.year = 4
      WHERE r.role_name IN ('Student', 'Club Head') AND u.year = 3 AND COALESCE(u.is_passout, 0) = 0
    `);

    // 3. Promote Year 2 -> Year 3
    const [p2] = await db.query(`
      UPDATE user u
      JOIN role r ON u.role_id = r.role_id
      SET u.year = 3
      WHERE r.role_name IN ('Student', 'Club Head') AND u.year = 2 AND COALESCE(u.is_passout, 0) = 0
    `);

    // 4. Promote Year 1 -> Year 2
    const [p1] = await db.query(`
      UPDATE user u
      JOIN role r ON u.role_id = r.role_id
      SET u.year = 2
      WHERE r.role_name IN ('Student', 'Club Head') AND u.year = 1 AND COALESCE(u.is_passout, 0) = 0
    `);

    // Unassign any graduated Club Heads
    await db.query(`
      UPDATE club c
      JOIN user u ON c.club_head_id = u.user_id
      SET c.club_head_id = NULL
      WHERE u.is_passout = 1
    `);

    return {
      graduated: gradRes.affectedRows,
      promoted: (p1.affectedRows || 0) + (p2.affectedRows || 0) + (p3.affectedRows || 0)
    };
  },

  findOtherHoldersOfRole: async (roleId, excludeUserId) => {
    const [rows] = await db.query(
      "SELECT user_id, name FROM user WHERE role_id = ? AND user_id != ?",
      [roleId, excludeUserId]
    );
    return rows;
  },

  getAuthoritySeatsData: async () => {
    // Fetch current holders of Admin (3), Estate Manager (6), Principal (7), Director (8)
    const [holders] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.department, u.role_id, r.role_name, u.is_retired, u.is_passout
      FROM user u
      JOIN role r ON u.role_id = r.role_id
      WHERE u.role_id IN (3, 6, 7, 8)
      ORDER BY FIELD(u.role_id, 3, 8, 7, 6)
    `);

    // Fetch candidate faculty members (Active non-retired Teachers + current authorities, excluding active Club Mentors/Heads)
    const [facultyCandidates] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.department, u.role_id, r.role_name
      FROM user u
      JOIN role r ON u.role_id = r.role_id
      WHERE r.role_name IN ('Teacher', 'Estate Manager', 'Principal', 'Director', 'Admin')
        AND COALESCE(u.is_retired, 0) = 0
        AND u.user_id NOT IN (
          SELECT DISTINCT club_mentor_id FROM club WHERE club_mentor_id IS NOT NULL
        )
        AND u.user_id NOT IN (
          SELECT DISTINCT club_head_id FROM club WHERE club_head_id IS NOT NULL
        )
      ORDER BY u.name ASC
    `);

    return {
      currentHolders: holders,
      facultyCandidates: facultyCandidates
    };
  },

  delete: async (userId) => {
    await db.query("UPDATE club SET club_head_id = NULL WHERE club_head_id = ?", [userId]);
    await db.query("UPDATE club SET club_mentor_id = NULL WHERE club_mentor_id = ?", [userId]);
    await db.query("UPDATE event SET organizer_id = NULL WHERE organizer_id = ?", [userId]);
    await db.query("DELETE FROM club_member WHERE user_id = ?", [userId]);
    await db.query("DELETE FROM event_registration WHERE student_id = ?", [userId]);
    await db.query("DELETE FROM notification WHERE user_id = ?", [userId]);
    await db.query("DELETE FROM permission_approval WHERE authority_id = ?", [userId]);
    await db.query("DELETE FROM permission_request WHERE requester_id = ?", [userId]);
    await db.query("DELETE FROM feedback WHERE user_id = ?", [userId]);
    const [res] = await db.query("DELETE FROM user WHERE user_id = ?", [userId]);
    return res.affectedRows > 0;
  }
};
