import { PermissionModel } from "../models/permissionModel.js";

export const permissionService = {
  createRequest: async (data) => {
    return await PermissionModel.createRequest(data);
  },

  getUserRequests: async (userId) => {
    return await PermissionModel.getMyRequests(userId);
  },

  getPendingForAuthority: async (roleId, userId) => {
    return await PermissionModel.getPendingForAuthority(roleId, userId);
  },

  updateStatus: async (requestId, authorityId, level, status, remarks) => {
    return await PermissionModel.updateStatus(requestId, authorityId, level, status, remarks);
  }
};

export default permissionService;
