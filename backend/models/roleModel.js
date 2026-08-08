import { db } from "../config/db.js";

export const RoleModel = {
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM role");
    return rows;
  },

  getById: async (roleId) => {
    const [[row]] = await db.query("SELECT * FROM role WHERE role_id = ?", [roleId]);
    return row;
  }
};
