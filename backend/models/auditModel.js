import { db } from "../config/db.js";

export const AuditModel = {
  log: async ({ user_id, action, entity_type, entity_id, target, ip }) => {
    await db.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, target, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        action || null,
        entity_type || null,
        entity_id || null,
        target || null,
        ip || null
      ]
    );
  }
};
