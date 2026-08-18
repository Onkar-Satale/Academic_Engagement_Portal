import jwt from "jsonwebtoken";
import { RoleModel } from "../models/roleModel.js";
import { UserModel } from "../models/userModel.js";
import { ClubModel } from "../models/clubModel.js";
import { PermissionModel } from "../models/permissionModel.js";
import { NotificationModel } from "../models/notificationModel.js";
import ApiError from "../utils/ApiError.js";

export const userService = {
  getAllRoles: async () => {
    return await RoleModel.getAll();
  },

  getAllUsers: async () => {
    return await UserModel.getAllUsers();
  },

  getProfile: async (userId) => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "1d";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    const token = jwt.sign({ id: user.user_id, role_id: user.role_id }, accessSecret, { expiresIn: accessExpiresIn });
    const refreshToken = jwt.sign({ id: user.user_id, role_id: user.role_id }, refreshSecret, { expiresIn: refreshExpiresIn });

    const userObj = {
      id: user.user_id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      department: user.department,
      year: user.year,
      role: user.role_id,
      role_id: user.role_id,
      role_name: user.role_name,
      profile_photo: user.profile_photo
    };

    return { user: userObj, token, refreshToken };
  },

  getMyAuthorityHistory: async (userId) => {
    return await PermissionModel.getDecisionsByAuthority(userId);
  },

  deleteAccount: async (userId) => {
    return await UserModel.delete(userId);
  },

  deleteUserById: async (adminUserId, targetUserId) => {
    if (Number(adminUserId) === Number(targetUserId)) {
      throw new ApiError(400, "Admins cannot delete their own account from the user directory.");
    }
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, "User not found");
    }
    return await UserModel.delete(targetUserId);
  },

  adminUpdateUserRole: async (adminUserId, targetUserId, newRoleId) => {
    const roleIdNum = Number(newRoleId);
    if (!roleIdNum) {
      throw new ApiError(400, "Invalid role ID.");
    }
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, "User not found.");
    }

    const currentRoleId = Number(targetUser.role_id);
    if (roleIdNum === currentRoleId) {
      return targetUser;
    }

    const targetRole = await RoleModel.getById(roleIdNum);
    const targetRoleName = targetRole?.role_name || "New Role";

    // Strict Barrier: Student Track (Student, Club Head) vs Faculty Track (Teacher, Club Mentor, Estate Manager, Principal, Admin)
    if ((currentRoleId === 1 || currentRoleId === 4) && (roleIdNum !== 1 && roleIdNum !== 4)) {
      throw new ApiError(400, "Students and Club Heads cannot be converted into Faculty or Institutional Authorities.");
    }
    if ((currentRoleId !== 1 && currentRoleId !== 4) && (roleIdNum === 1 || roleIdNum === 4)) {
      throw new ApiError(400, "Faculty and Institutional Authorities cannot be converted into Students.");
    }

    // 1. If removing Club Head, clear club head reference via ClubModel
    if (currentRoleId === 4 && roleIdNum !== 4) {
      await ClubModel.clearHead(targetUserId);
    }

    // 2. If removing Club Mentor, clear club mentor reference via ClubModel
    if (currentRoleId === 5 && roleIdNum !== 5) {
      await ClubModel.clearMentor(targetUserId);
    }

    // 3. For single-chair executive roles (Estate Manager, Principal, Admin),
    // automatically transition previous holder to Teacher so there is one primary chair holder
    if (["Estate Manager", "Principal"].includes(targetRoleName)) {
      const teacherRole = await RoleModel.getByName("Teacher");
      const teacherRoleId = teacherRole ? teacherRole.role_id : 2;

      const existingHolders = await UserModel.findOtherHoldersOfRole(roleIdNum, targetUserId);

      for (const holder of existingHolders) {
        await UserModel.updateRole(holder.user_id, teacherRoleId);
        await NotificationModel.createNotification({
          user_id: holder.user_id,
          title: `🏛️ Executive Transition: ${targetRoleName}`,
          message: `${targetUser.name} has been appointed as the new ${targetRoleName}. Your account role has transitioned to Teacher.`,
          type: "info",
          link: "/account"
        });
      }
    }

    // 4. Update the target user's role
    await UserModel.updateRole(targetUserId, roleIdNum);

    // 5. Notify the user of their new role
    const adminUser = await UserModel.findById(adminUserId);
    await NotificationModel.createNotification({
      user_id: targetUserId,
      title: `⚡ Role Updated: ${targetRoleName}`,
      message: `Your account role has been updated to "${targetRoleName}" by Administrator ${adminUser?.name || ''}.`,
      type: "info",
      link: "/account"
    });

    return await UserModel.findById(targetUserId);
  },

  getAuthoritySeats: async () => {
    return await UserModel.getAuthoritySeatsData();
  },

  updateAuthoritySeats: async (adminUserId, seats) => {
    const { admin_id, principal_id, estate_manager_id } = seats;
    const teacherRole = await RoleModel.getByName("Teacher");
    const teacherRoleId = teacherRole ? teacherRole.role_id : 2;

    const assignSeat = async (userId, targetRoleId, roleTitle) => {
      if (!userId) return;
      const uid = Number(userId);
      const rid = Number(targetRoleId);

      const targetUser = await UserModel.findById(uid);
      if (!targetUser) {
        throw new ApiError(404, "Selected user not found.");
      }

      // Strict Barrier: Students and Club Heads can NEVER hold Faculty Authority Chairs
      if (Number(targetUser.role_id) === 1 || Number(targetUser.role_id) === 4) {
        throw new ApiError(400, `Students and Club Heads cannot be appointed as ${roleTitle}. Only faculty/teachers can hold institutional posts.`);
      }

      const isAlreadyHoldingRole = Number(targetUser.role_id) === rid;

      // Check current holder of this role
      const currentHolders = await UserModel.findOtherHoldersOfRole(rid, uid);
      for (const ch of currentHolders) {
        // Demote previous holder to Teacher unless they are being assigned another chair
        const isBeingReassigned = [admin_id, principal_id, estate_manager_id].map(Number).includes(Number(ch.user_id));
        if (!isBeingReassigned) {
          await UserModel.updateRole(ch.user_id, teacherRoleId);
          await NotificationModel.createNotification({
            user_id: ch.user_id,
            title: `🏛️ Executive Transition: ${roleTitle}`,
            message: `${targetUser.name} has been appointed as the new ${roleTitle}. Your account role has transitioned to Teacher.`,
            type: "info",
            link: "/account"
          });
        }
      }

      // Only update role and send notification IF the role is actually changing for this user
      if (!isAlreadyHoldingRole) {
        await UserModel.updateRole(uid, rid);

        await NotificationModel.createNotification({
          user_id: uid,
          title: `🏛️ Appointed as ${roleTitle}`,
          message: `You have been appointed to the post of ${roleTitle}.`,
          type: "success",
          link: "/approvals"
        });
      }
    };

    if (principal_id) await assignSeat(principal_id, 7, "Principal");
    if (estate_manager_id) await assignSeat(estate_manager_id, 6, "Estate Manager");
    if (admin_id) await assignSeat(admin_id, 3, "Admin");

    return { success: true, message: "Authority chairs updated successfully!" };
  }
};

export default userService;
