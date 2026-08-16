import { db } from "../config/db.js";

export const RoleKeyModel = {
  create: async ({ secret_key, role_id }) => {
    const [res] = await db.query(
      "INSERT INTO role_invite_key (secret_key, role_id, is_used) VALUES (?, ?, FALSE)",
      [secret_key, role_id]
    );
    return res.insertId;
  },

  findByKey: async (secret_key) => {
    const [[row]] = await db.query(
      "SELECT * FROM role_invite_key WHERE secret_key = ?",
      [secret_key]
    );
    return row;
  },

  findActiveByRole: async (role_id) => {
    const [[row]] = await db.query(
      "SELECT * FROM role_invite_key WHERE role_id = ? LIMIT 1",
      [role_id]
    );
    return row;
  },

  markKeyAsUsed: async (key_id) => {
    const [res] = await db.query(
      "UPDATE role_invite_key SET is_used = TRUE WHERE key_id = ?",
      [key_id]
    );
    return res.affectedRows > 0;
  },

  validateAndConsume: async (secret_key, role_id) => {
    const [[keyRecord]] = await db.query(
      "SELECT * FROM role_invite_key WHERE secret_key = ?",
      [secret_key]
    );

    if (!keyRecord) {
      return { valid: false, reason: "Invalid secret key" };
    }

    if (Number(keyRecord.role_id) !== Number(role_id)) {
      return { valid: false, reason: "Key is not valid for this specific role" };
    }

    if (keyRecord.is_used) {
      return { valid: false, reason: "This secret key has already been used" };
    }

    // Mark key as used atomically
    await db.query(
      "UPDATE role_invite_key SET is_used = TRUE WHERE key_id = ?",
      [keyRecord.key_id]
    );

    return { valid: true, keyRecord };
  },

  revokeKey: async (secret_key) => {
    const [res] = await db.query(
      "DELETE FROM role_invite_key WHERE secret_key = ?",
      [secret_key]
    );
    return res.affectedRows > 0;
  },

  getAllKeys: async () => {
    const [rows] = await db.query(`
      SELECT rk.*, r.role_name 
      FROM role_invite_key rk
      LEFT JOIN role r ON rk.role_id = r.role_id
      ORDER BY rk.created_at DESC
    `);
    return rows;
  }
};
