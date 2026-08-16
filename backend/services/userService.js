import { RoleModel } from "../models/roleModel.js";
import { UserModel } from "../models/userModel.js";

export const userService = {
  getAllRoles: async () => {
    return await RoleModel.getAll();
  },

  getAllUsers: async () => {
    return await UserModel.getAllUsers();
  },

  deleteAccount: async (userId) => {
    return await UserModel.delete(userId);
  },

  deleteUserById: async (adminUserId, targetUserId) => {
    if (Number(adminUserId) === Number(targetUserId)) {
      throw new Error("Admins cannot delete their own account from the user directory.");
    }
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    return await UserModel.delete(targetUserId);
  }
};

export default userService;
