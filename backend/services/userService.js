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
      is_active: user.is_active,
      is_retired: user.is_retired ? 1 : 0,
      is_passout: user.is_passout ? 1 : 0,
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

  toggleUserStatus: async (adminUserId, targetUserId) => {
    if (Number(adminUserId) === Number(targetUserId)) {
      throw new ApiError(400, "You cannot deactivate your own administrative account.");
    }
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, "User not found");
    }

    const updated = await UserModel.toggleActiveStatus(targetUserId);
    const statusText = updated.is_active === 1 ? "Activated" : "Deactivated";

    await NotificationModel.createNotification({
      user_id: targetUserId,
      title: `Account Status: ${statusText}`,
      message: `Your portal account has been ${statusText.toLowerCase()} by the Administrator.`,
      type: updated.is_active === 1 ? "success" : "warning",
      link: "/account"
    });

    return updated;
  },

  toggleSelfRetiredStatus: async (userId) => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Students / Club Heads cannot declare retirement
    if (user.role_name === "Student" || user.role_name === "Club Head") {
      throw new ApiError(400, "Retirement status is only applicable to Faculty and Teachers.");
    }

    const isAlreadyRetired = user.is_retired === 1 || user.is_retired === true;
    if (!isAlreadyRetired) {
      // Must not hold executive institutional post
      if (["Club Mentor", "Estate Manager", "Principal", "Director", "Admin"].includes(user.role_name)) {
        throw new ApiError(400, `Cannot declare retirement while holding active institutional position '${user.role_name}'. Please first reassign your position in Authority Seats or Club Management and change your role to normal Teacher.`);
      }
      // Must not be active club mentor
      const activeMentorClub = await ClubModel.findActiveClubByMentor(userId);
      if (activeMentorClub) {
        throw new ApiError(400, `Cannot declare retirement while actively serving as Club Mentor for '${activeMentorClub.name}'. Please reassign the club mentorship to another teacher first.`);
      }
    }

    const updated = await UserModel.toggleRetiredStatus(userId);
    const statusText = updated.is_retired === 1 ? "Retired Faculty" : "Active Faculty";

    await NotificationModel.createNotification({
      user_id: userId,
      title: `🏷️ Status Updated: ${statusText}`,
      message: updated.is_retired === 1 
        ? "You have marked your status as Retired Teacher/Faculty."
        : "Your status has been updated to Active Faculty.",
      type: updated.is_retired === 1 ? "info" : "success",
      link: "/account"
    });

    return updated;
  },

  adminToggleUserRetiredStatus: async (adminUserId, targetUserId) => {
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, "User not found");
    }

    if (targetUser.role_name === "Student" || targetUser.role_name === "Club Head") {
      throw new ApiError(400, "Retirement status is only applicable to Faculty and Teachers.");
    }

    const isAlreadyRetired = targetUser.is_retired === 1 || targetUser.is_retired === true;
    if (!isAlreadyRetired) {
      // Must not hold executive institutional post
      if (["Club Mentor", "Estate Manager", "Principal", "Director", "Admin"].includes(targetUser.role_name)) {
        throw new ApiError(400, `Cannot retire faculty member while they hold active position '${targetUser.role_name}'. Please first reassign their position to another teacher and set their role to normal Teacher.`);
      }
      // Must not be active club mentor
      const activeMentorClub = await ClubModel.findActiveClubByMentor(targetUserId);
      if (activeMentorClub) {
        throw new ApiError(400, `Cannot retire faculty member while they are the active Club Mentor for '${activeMentorClub.name}'. Please reassign the club mentorship first.`);
      }
    }

    const updated = await UserModel.toggleRetiredStatus(targetUserId);
    const statusText = updated.is_retired === 1 ? "Retired Faculty" : "Active Faculty";

    await NotificationModel.createNotification({
      user_id: targetUserId,
      title: `🏷️ Status Tag Updated: ${statusText}`,
      message: `Your account status was set to ${statusText} by Administrator.`,
      type: updated.is_retired === 1 ? "info" : "success",
      link: "/account"
    });

    return updated;
  },

  toggleSelfPassoutStatus: async (userId) => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Only students / club heads can declare passout
    if (user.role_name !== "Student" && user.role_name !== "Club Head") {
      throw new ApiError(400, "Passout / Alumni status is only applicable to Students.");
    }

    const isAlreadyPassout = user.is_passout === 1 || user.is_passout === true;
    if (!isAlreadyPassout) {
      if (user.role_name === "Club Head") {
        throw new ApiError(400, "Cannot mark yourself as Passout while holding the active 'Club Head' position. Please handover/reassign the Club Head post to a junior student first.");
      }
      const activeHeadClub = await ClubModel.findActiveClubByHead(userId);
      if (activeHeadClub) {
        throw new ApiError(400, `Cannot mark yourself as Passout while serving as active Club Head for '${activeHeadClub.name}'. Please handover the Club Head post first.`);
      }
    }

    const updated = await UserModel.togglePassoutStatus(userId);
    const statusText = updated.is_passout === 1 ? "Passout / Alumni" : "Active Student";

    await NotificationModel.createNotification({
      user_id: userId,
      title: `🎓 Academic Status Updated: ${statusText}`,
      message: updated.is_passout === 1 
        ? "Congratulations on graduating! Your account has been updated to Passout / Alumni."
        : "Your academic status has been restored to Active Student.",
      type: updated.is_passout === 1 ? "success" : "info",
      link: "/account"
    });

    return updated;
  },

  adminToggleUserPassoutStatus: async (adminUserId, targetUserId) => {
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, "User not found");
    }

    if (targetUser.role_name !== "Student" && targetUser.role_name !== "Club Head") {
      throw new ApiError(400, "Passout / Alumni status is only applicable to Students.");
    }

    const isAlreadyPassout = targetUser.is_passout === 1 || targetUser.is_passout === true;
    if (!isAlreadyPassout) {
      if (targetUser.role_name === "Club Head") {
        throw new ApiError(400, `Cannot mark student '${targetUser.name}' as Passout while they hold the active 'Club Head' role. Please reassign the Club Head position to a junior student and change their role to normal Student first.`);
      }
      const activeHeadClub = await ClubModel.findActiveClubByHead(targetUserId);
      if (activeHeadClub) {
        throw new ApiError(400, `Cannot mark student '${targetUser.name}' as Passout while they are the active Club Head of '${activeHeadClub.name}'. Please reassign the Club Head position first.`);
      }
    }

    const updated = await UserModel.togglePassoutStatus(targetUserId);
    const statusText = updated.is_passout === 1 ? "Passout / Alumni" : "Active Student";

    await NotificationModel.createNotification({
      user_id: targetUserId,
      title: `🎓 Status Updated: ${statusText}`,
      message: `Your student status was updated to ${statusText} by the Administrator.`,
      type: updated.is_passout === 1 ? "success" : "info",
      link: "/account"
    });

    return updated;
  },

  batchGraduateFinalYear: async (adminUserId, department = null) => {
    // Check if ANY 4th-year (BE) student in target batch is currently an active Club Head
    const activeHeads = await ClubModel.findActiveHeadsInYear(4, department);
    if (activeHeads.length > 0) {
      const headNames = activeHeads.map(h => `${h.name} (${h.club_name})`).join(", ");
      throw new ApiError(400, `Cannot graduate batch: ${headNames} is/are currently active Club Head(s). Please first handover their Club Head post to a junior student and make them normal Student, then proceed.`);
    }

    const count = await UserModel.batchGraduateFinalYear(department);
    return {
      success: true,
      message: `Successfully graduated ${count} Final Year (BE - Year 4) student(s) to Passout / Alumni! 🎓`,
      count
    };
  },

  batchPromoteAcademicYears: async (adminUserId) => {
    // Check if ANY 4th-year (BE) student is currently an active Club Head
    const activeHeads = await ClubModel.findActiveHeadsInYear(4, "all");
    if (activeHeads.length > 0) {
      const headNames = activeHeads.map(h => `${h.name} (${h.club_name})`).join(", ");
      throw new ApiError(400, `Cannot perform annual roll-over: ${headNames} is/are currently active Club Head(s). Please first handover their Club Head post to junior students before rolling over.`);
    }

    const result = await UserModel.batchPromoteAcademicYears();
    return {
      success: true,
      message: `Academic year transition completed! ${result.graduated} Final Year student(s) graduated to Alumni, and ${result.promoted} student(s) promoted to their next academic year. 🚀`,
      ...result
    };
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

    // Strict Barrier: Student Track (Student, Club Head) vs Faculty Track (Teacher, Club Mentor, Estate Manager, Principal, Director, Admin)
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

    // 3. For single-chair executive roles (Estate Manager, Principal, Director),
    // automatically transition previous holder to Teacher so there is one primary chair holder
    if (["Estate Manager", "Principal", "Director"].includes(targetRoleName)) {
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
    const { admin_id, director_id, principal_id, estate_manager_id } = seats;
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
        const isBeingReassigned = [admin_id, director_id, principal_id, estate_manager_id].map(Number).includes(Number(ch.user_id));
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

    if (director_id) await assignSeat(director_id, 8, "Director");
    if (principal_id) await assignSeat(principal_id, 7, "Principal");
    if (estate_manager_id) await assignSeat(estate_manager_id, 6, "Estate Manager");
    if (admin_id) await assignSeat(admin_id, 3, "Admin");

    return { success: true, message: "Authority chairs updated successfully!" };
  }
};

export default userService;
