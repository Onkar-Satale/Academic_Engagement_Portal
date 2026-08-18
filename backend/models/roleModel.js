import { db } from "../config/db.js";

export const RoleModel = {
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM role ORDER BY role_id ASC");
    return rows;
  },

  getById: async (roleId) => {
    const [[row]] = await db.query("SELECT * FROM role WHERE role_id = ?", [roleId]);
    return row;
  },

  getByName: async (roleName) => {
    const [[row]] = await db.query("SELECT * FROM role WHERE role_name = ?", [roleName]);
    return row;
  }
};
