import { RoleModel } from "../models/roleModel.js";
import { UserModel } from "../models/userModel.js";

export const userService = {
  getAllRoles: async () => {
    return await RoleModel.getAll();
  },

  deleteAccount: async (userId) => {
    return await UserModel.delete(userId);
  }
};

export default userService;
