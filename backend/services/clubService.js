import { ClubModel } from "../models/clubModel.js";
import { ClubMemberModel } from "../models/clubMemberModel.js";
import { NotificationModel } from "../models/notificationModel.js";
import { UserModel } from "../models/userModel.js";
import { RoleModel } from "../models/roleModel.js";

export const clubService = {
  syncOrphanedClubLeaders: async () => {
    await ClubModel.syncOrphanedLeaders();
  },

  getAllClubs: async () => {
    await ClubModel.syncOrphanedLeaders();
    return await ClubModel.getAllWithDetails();
  },

  getCandidates: async () => {
    await ClubModel.syncOrphanedLeaders();
    return await ClubModel.getCandidates();
  },

  getClubById: async (clubId) => {
    return await ClubModel.getByIdWithDetails(clubId);
  },

  createClub: async (data) => {
    const clubId = await ClubModel.create(data);

    // Resolve dynamic role IDs via RoleModel
    const headRole = await RoleModel.getByName("Club Head");
    const mentorRole = await RoleModel.getByName("Club Mentor");

    // If club_head_id is assigned, promote student to Club Head
    if (data.club_head_id && headRole) {
      await UserModel.updateRole(data.club_head_id, headRole.role_id);
      try {
        await ClubMemberModel.addApprovedMember(clubId, data.club_head_id);
      } catch (mErr) {
        console.warn("Could not insert club head into club_member:", mErr);
      }
    }

    // If club_mentor_id is assigned, promote teacher to Club Mentor
    if (data.club_mentor_id && mentorRole) {
      await UserModel.updateRole(data.club_mentor_id, mentorRole.role_id);
    }

    await ClubModel.syncOrphanedLeaders();

    try {
      await NotificationModel.broadcastNotification({
        title: "🏛️ New Club Established!",
        message: `"${data.name}" has just been launched on PICT Portal! Check it out and explore upcoming activities.`,
        type: "info",
        link: `/clubs/${clubId}`
      });
    } catch (nErr) {
      console.warn("Broadcast notification warning for new club:", nErr);
    }
    return clubId;
  },

  updateClub: async (clubId, data) => {
    const existingClub = await ClubModel.getByIdWithDetails(clubId);
    const oldHeadId = existingClub ? existingClub.club_head_id : null;
    const oldMentorId = existingClub ? existingClub.club_mentor_id : null;

    const sanitizeId = (val) => {
      if (val === "" || val === null || val === undefined || val === "null" || isNaN(Number(val))) {
        return null;
      }
      return Number(val);
    };

    const newHeadId = data.club_head_id !== undefined ? sanitizeId(data.club_head_id) : oldHeadId;
    const newMentorId = data.club_mentor_id !== undefined ? sanitizeId(data.club_mentor_id) : oldMentorId;

    const result = await ClubModel.update(clubId, data);

    // Resolve dynamic role IDs via RoleModel
    const headRole = await RoleModel.getByName("Club Head");
    const studentRole = await RoleModel.getByName("Student");
    const mentorRole = await RoleModel.getByName("Club Mentor");
    const teacherRole = await RoleModel.getByName("Teacher");

    // 1. Handle Club Head role transition
    if (oldHeadId !== newHeadId) {
      // Demote previous head to Student if they don't head any other club
      if (oldHeadId && studentRole) {
        const otherClubsCount = await ClubModel.countOtherClubsForHead(oldHeadId, clubId);
        if (otherClubsCount === 0) {
          await UserModel.updateRole(oldHeadId, studentRole.role_id);
        }
      }

      // Promote new head to Club Head
      if (newHeadId && headRole) {
        await UserModel.updateRole(newHeadId, headRole.role_id);
        try {
          await ClubMemberModel.addApprovedMember(clubId, newHeadId);
        } catch (mErr) {
          console.warn("Could not insert new head into club_member:", mErr);
        }
      }
    }

    // 2. Handle Club Mentor role transition
    if (oldMentorId !== newMentorId) {
      // Revert previous mentor to Teacher if they don't mentor any other club
      if (oldMentorId && teacherRole) {
        const otherClubsCount = await ClubModel.countOtherClubsForMentor(oldMentorId, clubId);
        if (otherClubsCount === 0) {
          await UserModel.updateRole(oldMentorId, teacherRole.role_id);
        }
      }

      // Promote new mentor to Club Mentor
      if (newMentorId && mentorRole) {
        await UserModel.updateRole(newMentorId, mentorRole.role_id);
      }
    }

    await ClubModel.syncOrphanedLeaders();

    return result;
  },

  deleteClub: async (clubId) => {
    const res = await ClubModel.delete(clubId);
    await ClubModel.syncOrphanedLeaders();
    return res;
  },

  getEnrolledClubs: async (userId) => {
    return await ClubMemberModel.getEnrolledClubs(userId);
  },

  getClubMembers: async (clubId) => {
    return await ClubMemberModel.getClubMembers(clubId);
  },

  addStudent: async (clubId, studentData) => {
    return await ClubMemberModel.addStudent(clubId, studentData);
  },

  removeStudent: async (clubId, email) => {
    return await ClubMemberModel.removeStudent(clubId, email);
  },

  toggleRegistration: async (clubId, isOpen) => {
    return await ClubModel.updateRegistrationStatus(clubId, isOpen);
  },

  joinClub: async (clubId, userId, reason) => {
    return await ClubMemberModel.join(clubId, userId, reason);
  },

  leaveClub: async (clubId, userId) => {
    return await ClubMemberModel.leave(clubId, userId);
  },

  getPendingApplications: async (clubId) => {
    return await ClubMemberModel.getPendingApplications(clubId);
  },

  processApplication: async (clubId, userId, action) => {
    return await ClubMemberModel.updateApplicationStatus(clubId, userId, action === "approve" ? "approved" : "rejected");
  },

  getMemberStatus: async (clubId, userId) => {
    return await ClubMemberModel.getMemberStatus(clubId, userId);
  },

  getUserAssociatedClubs: async (userId, userRole) => {
    return await ClubMemberModel.getUserAssociatedClubs(userId, userRole);
  }
};

export default clubService;
