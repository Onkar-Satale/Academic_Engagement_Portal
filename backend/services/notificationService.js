import { NotificationModel } from "../models/notificationModel.js";

export const notificationService = {
  getUserNotifications: async (userId) => {
    return await NotificationModel.getUserNotifications(userId);
  },

  markAsRead: async (notificationId, userId) => {
    return await NotificationModel.markAsRead(notificationId, userId);
  },

  createNotification: async (data) => {
    return await NotificationModel.createNotification(data);
  }
};

export default notificationService;
