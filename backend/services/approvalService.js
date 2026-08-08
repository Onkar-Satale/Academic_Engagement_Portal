import { ApprovalModel } from "../models/approvalModel.js";

export const approvalService = {
  addApproval: async (eventId, authorityId, status, remarks) => {
    return await ApprovalModel.createWithEventUpdate(eventId, authorityId, status, remarks);
  },

  getApprovals: async (eventId) => {
    return await ApprovalModel.getByEvent(eventId);
  }
};

export default approvalService;
