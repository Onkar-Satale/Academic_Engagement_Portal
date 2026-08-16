import { ClubModel } from "../models/clubModel.js";
import { ClubMemberModel } from "../models/clubMemberModel.js";
import { NotificationModel } from "../models/notificationModel.js";
import { UserModel } from "../models/userModel.js";

export const clubService = {
  getAllClubs: async () => {
    return await ClubModel.getAllWithDetails();
  },

  getClubById: async (clubId) => {
    return await ClubModel.getByIdWithDetails(clubId);
  },

  createClub: async (data) => {
    const clubId = await ClubModel.create(data);
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
    return await ClubModel.update(clubId, data);
  },

  deleteClub: async (clubId) => {
    return await ClubModel.delete(clubId);
  },

  setClubKey: async (clubId, keyType, secretKey) => {
    return await ClubModel.setClubKey(clubId, keyType, secretKey);
  },

  revokeClubKey: async (clubId, keyType) => {
    return await ClubModel.revokeClubKeyByType(clubId, keyType);
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

  expressInterest: async (userId, clubId) => {
    return await ClubMemberModel.expressInterest(userId, clubId);
  },

  getUserInterests: async (userId) => {
    return await ClubMemberModel.getUserInterests(userId);
  },

  joinClub: async (clubId, userId, reason) => {
    const res = await ClubMemberModel.join(clubId, userId, reason);
    try {
      const club = await ClubModel.getByIdWithDetails(clubId);
      const student = await UserModel.findById(userId);
      if (club && student) {
        const studentInfo = `${student.name} (${student.email})`;
        const motivationStr = reason ? ` Motivation: "${reason}"` : "";
        if (club.club_head_id) {
          await NotificationModel.createNotification({
            user_id: club.club_head_id,
            title: "📩 New Membership Application",
            message: `${studentInfo} applied to join ${club.name}.${motivationStr}`,
            type: "info",
            link: `/clubs/${clubId}/applications`
          });
        }
        if (club.club_mentor_id && club.club_mentor_id !== club.club_head_id) {
          await NotificationModel.createNotification({
            user_id: club.club_mentor_id,
            title: "📩 New Membership Application",
            message: `${studentInfo} applied to join ${club.name}.${motivationStr}`,
            type: "info",
            link: `/clubs/${clubId}/applications`
          });
        }
      }
    } catch (nErr) {
      console.warn("Notification creation warning in joinClub:", nErr);
    }
    return res;
  },

  getPendingApplications: async (clubId) => {
    return await ClubMemberModel.getPendingApplications(clubId);
  },

  processApplication: async (clubId, userId, action) => {
    const status = (action === 'approve' || action === 'accept') ? 'approved' : 'rejected';
    await ClubMemberModel.updateApplicationStatus(clubId, userId, status);

    try {
      const club = await ClubModel.getByIdWithDetails(clubId);
      if (club) {
        if (status === 'approved') {
          await NotificationModel.createNotification({
            user_id: userId,
            title: "🎉 Membership Application Accepted!",
            message: `Congratulations! Your application to join ${club.name} has been approved by the Club Head.`,
            type: "success",
            link: `/clubs/${clubId}`
          });
        } else {
          await NotificationModel.createNotification({
            user_id: userId,
            title: "❌ Membership Application Status",
            message: `Your application to join ${club.name} was not accepted at this time.`,
            type: "warning",
            link: `/clubs/${clubId}`
          });
        }
      }
    } catch (nErr) {
      console.warn("Notification error in processApplication:", nErr);
    }
    return true;
  },

  getMemberStatus: async (clubId, userId) => {
    return await ClubMemberModel.getMemberStatus(clubId, userId);
  },

  leaveClub: async (clubId, userId) => {
    return await ClubMemberModel.leave(clubId, userId);
  },

  getUserAssociatedClubs: async (userId, userRole) => {
    return await ClubMemberModel.getUserAssociatedClubs(userId, userRole);
  }
};

export default clubService;
