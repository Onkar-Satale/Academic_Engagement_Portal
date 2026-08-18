import { PermissionModel } from "../models/permissionModel.js";
import { NotificationModel } from "../models/notificationModel.js";
import { ClubModel } from "../models/clubModel.js";
import { UserModel } from "../models/userModel.js";
import { EventModel } from "../models/eventModel.js";

export const permissionService = {
  createRequest: async (data) => {
    // If replacing an existing rejected request, clean up the old request card first
    if (data.old_request_id) {
      try {
        await PermissionModel.deleteByRequester(data.old_request_id, data.requester_id);
      } catch (delErr) {
        console.warn("Could not delete old request during resubmission:", delErr.message);
      }
    }

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
          3: "Principal"
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
          if (currentLevel < 3) {
            const nextLevel = currentLevel + 1;
            const nextRoleName = roleNamesByLevel[nextLevel];
            const nextRoleIdMap = { 2: 6, 3: 7 };
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
            // Level 3 (Principal) Final Approval -> Automatically Publish Event via EventModel!
            let newEventId = null;
            try {
              newEventId = await EventModel.publishApprovedEvent({
                title: reqInfo.title,
                description: reqInfo.description,
                event_date: reqInfo.event_date,
                venue: reqInfo.venue,
                club_id: reqInfo.club_id,
                organizer_id: requesterId,
                conducted_by: reqInfo.club_name
              });
            } catch (evErr) {
              console.error("Failed to auto-create event upon final approval:", evErr);
            }

            // Direct Notification to Requester (Club Head)
            await NotificationModel.createNotification({
              user_id: requesterId,
              title: "🎉 EVENT OFFICIALLY APPROVED & PUBLISHED!",
              message: `Congratulations! Your event "${reqInfo.title}" for ${reqInfo.club_name} has received final Level 3 (Principal) approval and is now LIVE on the Events page!`,
              type: "success",
              link: newEventId ? `/events/${newEventId}` : "/my-events"
            });

            // Broadcast to Everyone on the Website!
            await NotificationModel.broadcastNotification({
              title: "🎉 New Campus Event Announced!",
              message: `"${reqInfo.title}" by ${reqInfo.club_name} is officially approved for ${formattedDate} at ${venue}. Check it out and explore details!`,
              type: "info",
              link: newEventId ? `/events/${newEventId}` : "/events"
            });
          }
        }
      }
    } catch (nErr) {
      console.warn("Notification error in permission pipeline updateStatus:", nErr);
    }

    return res;
  },

  deleteRequest: async (requestId, reqUser) => {
    const reqInfo = await PermissionModel.getByIdWithDetails(requestId);
    if (!reqInfo) {
      return { status: 404, message: "Permission request not found" };
    }

    const club = await ClubModel.getByIdWithDetails(reqInfo.club_id);
    const isOwner = Number(reqInfo.requester_id) === Number(reqUser.id);
    const isClubHead = club && (Number(club.club_head_id) === Number(reqUser.id));
    const isAdmin = Number(reqUser.role) === 3;

    if (!isOwner && !isClubHead && !isAdmin) {
      return { status: 403, message: "Not authorized to delete this permission request" };
    }

    // Collect all authorities involved up to current level
    try {
      const formattedDate = reqInfo.event_date ? new Date(reqInfo.event_date).toISOString().split('T')[0] : 'N/A';
      const venue = reqInfo.venue || 'TBD';

      const recipientUserIds = new Set();

      // 1. Club Mentor (Level 1)
      if (club && club.club_mentor_id) {
        recipientUserIds.add(club.club_mentor_id);
      }

      // 2. Estate Manager (Level 2) if request reached Level 2 or above
      if (reqInfo.current_level >= 2) {
        const estateUsers = await UserModel.findByRoleId(6);
        estateUsers.forEach(u => recipientUserIds.add(u.user_id));
      }

      // 3. Principal (Level 3) if request reached Level 3
      if (reqInfo.current_level >= 3) {
        const principalUsers = await UserModel.findByRoleId(7);
        principalUsers.forEach(u => recipientUserIds.add(u.user_id));
      }

      // 4. Any authority who reviewed in permission_approval
      const reviewerIds = await PermissionModel.getDistinctReviewers(requestId);
      reviewerIds.forEach(id => recipientUserIds.add(id));

      recipientUserIds.delete(reqUser.id);

      // Send withdrawal notification to all involved authorities
      for (const authUserId of recipientUserIds) {
        await NotificationModel.createNotification({
          user_id: authUserId,
          title: "🚫 Permission Request Withdrawn by Club Head",
          message: `The event permission request "${reqInfo.title}" for ${reqInfo.club_name} (Date: ${formattedDate}, Venue: ${venue}) has been cancelled and withdrawn by the Club Head.`,
          type: "warning",
          link: "/approvals"
        });
      }
    } catch (notifErr) {
      console.warn("Notification warning on deleteRequest:", notifErr);
    }

    await PermissionModel.delete(requestId);

    return { status: 200, message: "Permission request deleted successfully and authorities notified." };
  }
};

export default permissionService;
