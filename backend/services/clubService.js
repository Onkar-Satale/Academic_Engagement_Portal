import { ClubModel } from "../models/clubModel.js";
import { ClubMemberModel } from "../models/clubMemberModel.js";

export const clubService = {
  getAllClubs: async () => {
    return await ClubModel.getAllWithDetails();
  },

  getClubById: async (clubId) => {
    return await ClubModel.getByIdWithDetails(clubId);
  },

  createClub: async (data) => {
    return await ClubModel.create(data);
  },

  updateClub: async (clubId, data) => {
    return await ClubModel.update(clubId, data);
  },

  deleteClub: async (clubId) => {
    return await ClubModel.delete(clubId);
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

  joinClub: async (clubId, userId) => {
    return await ClubMemberModel.join(clubId, userId);
  },

  leaveClub: async (clubId, userId) => {
    return await ClubMemberModel.leave(clubId, userId);
  },

  getUserAssociatedClubs: async (userId, userRole) => {
    return await ClubMemberModel.getUserAssociatedClubs(userId, userRole);
  }
};

export default clubService;
