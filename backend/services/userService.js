import jwt from "jsonwebtoken";
import { RoleModel } from "../models/roleModel.js";
import { UserModel } from "../models/userModel.js";
import { ClubModel } from "../models/clubModel.js";
import { RoleKeyModel } from "../models/roleKeyModel.js";
import ApiError from "../utils/ApiError.js";

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
  },

  elevateRole: async (userId, secretKey) => {
    if (!secretKey || !secretKey.trim()) {
      throw new ApiError(400, "Secret key is required to elevate role.");
    }
    const cleanKey = secretKey.trim();

    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      throw new ApiError(404, "User not found");
    }

    let newRoleId = null;
    let assignedClubId = null;
    let newRoleName = "";

    // 1. Check if it is a Club Head Key
    const headClub = await ClubModel.findByHeadKey(cleanKey);
    if (headClub) {
      if (headClub.club_head_id) {
        throw new ApiError(400, "This Club Head key has already been claimed.");
      }
      newRoleId = 4;
      newRoleName = "Club Head";
      await ClubModel.assignHead(cleanKey, userId);
      assignedClubId = headClub.club_id;
    } 
    // 2. Check if it is a Club Mentor Key
    else {
      const mentorClub = await ClubModel.findByMentorKey(cleanKey);
      if (mentorClub) {
        if (mentorClub.club_mentor_id) {
          throw new ApiError(400, "This Club Mentor key has already been claimed.");
        }
        newRoleId = 5;
        newRoleName = "Club Mentor";
        await ClubModel.assignMentor(cleanKey, userId);
        assignedClubId = mentorClub.club_id;
      }
      // 3. Check if it is the System Admin Key
      else {
        const requiredAdminKey = (process.env.SYSTEM_ADMIN_SECRET_KEY || "").trim().replace(/^["']|["']$/g, "");
        if (requiredAdminKey && cleanKey === requiredAdminKey) {
          newRoleId = 3;
          newRoleName = "Admin";
        }
        // 4. Check if it is an Authority Key (Estate Manager, Principal, Director)
        else {
          const matchingKey = await RoleKeyModel.findByKey(cleanKey);
          if (!matchingKey) {
            throw new ApiError(400, "Invalid secret key. Please verify with your Administrator.");
          }
          if (matchingKey.is_used) {
            throw new ApiError(400, "This secret key has already been used.");
          }
          newRoleId = matchingKey.role_id;
          const roleObj = await RoleModel.getById(newRoleId);
          newRoleName = roleObj ? roleObj.role_name : "Authority";
          await RoleKeyModel.markKeyAsUsed(matchingKey.key_id);
        }
      }
    }

    // Update user role in database
    await UserModel.updateRole(userId, newRoleId);

    // Fetch updated user
    const updatedUser = await UserModel.findById(userId);

    // Generate fresh JWT tokens
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "1d";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    const token = jwt.sign({ id: updatedUser.user_id, role_id: newRoleId }, accessSecret, { expiresIn: accessExpiresIn });
    const refreshToken = jwt.sign({ id: updatedUser.user_id, role_id: newRoleId }, refreshSecret, { expiresIn: refreshExpiresIn });

    return {
      token,
      refreshToken,
      user: {
        id: updatedUser.user_id,
        user_id: updatedUser.user_id,
        name: updatedUser.name,
        email: updatedUser.email,
        department: updatedUser.department,
        year: updatedUser.year,
        role: newRoleId,
        role_id: newRoleId,
        role_name: newRoleName,
        club_id: assignedClubId,
        profile_photo: updatedUser.profile_photo
      }
    };
  },

  adminUpdateUserRole: async (adminUserId, targetUserId, newRoleId) => {
    const roleIdNum = Number(newRoleId);
    if (!roleIdNum || roleIdNum < 1 || roleIdNum > 8) {
      throw new ApiError(400, "Invalid role ID.");
    }
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, "User not found.");
    }
    await UserModel.updateRole(targetUserId, roleIdNum);
    return await UserModel.findById(targetUserId);
  }
};

export default userService;
