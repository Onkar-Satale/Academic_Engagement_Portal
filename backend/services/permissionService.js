import { PermissionModel } from "../models/permissionModel.js";
import { NotificationModel } from "../models/notificationModel.js";
import { ClubModel } from "../models/clubModel.js";
import { UserModel } from "../models/userModel.js";

export const permissionService = {
  createRequest: async (data) => {
    const requestId = await PermissionModel.createRequest(data);

    try {
      // Notify Club Mentor if level 1
      const club = await ClubModel.getByIdWithDetails(data.club_id);
      if (club && club.club_mentor_id) {
        const formattedDate = data.event_date ? new Date(data.event_date).toISOString().split('T')[0] : 'N/A';
        await NotificationModel.createNotification({
          user_id: club.club_mentor_id,
          title: "📄 New Permission Request Pending (Level 1)",
          message: `Event permission request "${data.title}" for ${club.name} scheduled for ${formattedDate} at ${data.venue || 'TBD'} is awaiting your Level 1 review.`,
          type: "info",
          link: "/approvals"
        });
      }
    } catch (nErr) {
      console.warn("Notification warning in createRequest:", nErr);
    }

    return requestId;
  },

  getUserRequests: async (userId) => {
    return await PermissionModel.getMyRequests(userId);
  },

  getPendingForAuthority: async (roleId, userId) => {
    return await PermissionModel.getPendingForAuthority(roleId, userId);
  },

  updateStatus: async (requestId, authorityId, level, status, remarks) => {
    // Fetch current request state before updating
    const reqInfo = await PermissionModel.getByIdWithDetails(requestId);

    // Update permission status in database
    const res = await PermissionModel.updateStatus(requestId, authorityId, level, status, remarks);

    // Dispatch detailed multi-level pipeline notifications
    try {
      if (reqInfo) {
        const requesterId = reqInfo.requester_id;
        const currentLevel = reqInfo.current_level;
        const actionTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedDate = reqInfo.event_date ? new Date(reqInfo.event_date).toISOString().split('T')[0] : 'N/A';
        const venue = reqInfo.venue || 'TBD';

        const roleNamesByLevel = {
          1: "Club Mentor",
          2: "Estate Manager",
          3: "Principal",
          4: "Director"
        };
        const authorityRoleName = roleNamesByLevel[currentLevel] || "Authority";

        if (status === "rejected") {
          // Detailed Rejection Notification to Requester (Club Head)
          await NotificationModel.createNotification({
            user_id: requesterId,
            title: `❌ Permission Request Rejected (Level ${currentLevel})`,
            message: `Your permission request "${reqInfo.title}" for ${reqInfo.club_name} (Date: ${formattedDate}, Venue: ${venue}) was rejected by ${authorityRoleName} at ${actionTimestamp}.${remarks ? ` Feedback/Remarks: "${remarks}"` : ""}`,
            type: "warning",
            link: "/my-requests"
          });
        } else if (status === "approved") {
          if (currentLevel < 4) {
            const nextLevel = currentLevel + 1;
            const nextRoleName = roleNamesByLevel[nextLevel];
            const nextRoleIdMap = { 2: 6, 3: 7, 4: 8 };
            const nextRoleId = nextRoleIdMap[nextLevel];

            // Detailed Advancement Notification to Requester (Club Head)
            await NotificationModel.createNotification({
              user_id: requesterId,
              title: `✅ Level ${currentLevel} Approved (${authorityRoleName})`,
              message: `Level ${currentLevel} approved by ${authorityRoleName} at ${actionTimestamp}. Your request "${reqInfo.title}" for ${reqInfo.club_name} (Date: ${formattedDate}, Venue: ${venue}) has advanced to Level ${nextLevel} (${nextRoleName}) for review.`,
              type: "success",
              link: "/my-requests"
            });

            // Detailed Review Notification to Next-Level Authority users
            if (nextRoleId) {
              const nextAuthUsers = await UserModel.findByRoleId(nextRoleId);
              for (const authUser of nextAuthUsers) {
                await NotificationModel.createNotification({
                  user_id: authUser.user_id,
                  title: `📄 Level ${nextLevel} Review Pending (${nextRoleName})`,
                  message: `Event permission request "${reqInfo.title}" (${reqInfo.club_name}, Date: ${formattedDate}, Venue: ${venue}) was approved by ${authorityRoleName} at ${actionTimestamp} and is now awaiting your review.`,
                  type: "info",
                  link: "/approvals"
                });
              }
            }
          } else {
            // Detailed Final Approval & Event Registration Confirmation to Requester (Club Head)
            await NotificationModel.createNotification({
              user_id: requesterId,
              title: "🎉 EVENT OFFICIALLY APPROVED & REGISTERED!",
              message: `Congratulations! Your event "${reqInfo.title}" for ${reqInfo.club_name} is officially approved and confirmed for ${formattedDate} at ${venue}! All 4 approval levels (Club Mentor ➔ Estate Manager ➔ Principal ➔ Director) are 100% complete.`,
              type: "success",
              link: "/my-requests"
            });
          }
        }
      }
    } catch (nErr) {
      console.warn("Notification error in permission pipeline updateStatus:", nErr);
    }

    return res;
  }
};

export default permissionService;
