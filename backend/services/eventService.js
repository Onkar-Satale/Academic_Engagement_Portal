import { EventRegistrationModel } from "../models/eventRegistrationModel.js";
import { EventModel } from "../models/eventModel.js";
import { ClubModel } from "../models/clubModel.js";
import { NotificationModel } from "../models/notificationModel.js";
import ApiError from "../utils/ApiError.js";

export const eventService = {
  getAllEvents: async () => {
    return await EventModel.getAll();
  },

  getEventById: async (eventId) => {
    return await EventModel.getByIdWithDetails(eventId);
  },

  createEvent: async (reqUser, bodyData) => {
    return await EventModel.createWithOrganizer(reqUser, bodyData);
  },

  deleteEvent: async (eventId, reqUser) => {
    return await EventModel.delete(eventId, reqUser);
  },

  updateEvent: async (eventId, reqUser, bodyData) => {
    return await EventModel.update(eventId, reqUser, bodyData);
  },

  registerForEvent: async (user_id, bodyData) => {
    const { event_id, ...formData } = bodyData;
    const alreadyRegistered = await EventRegistrationModel.isAlreadyRegistered(event_id, user_id);
    if (alreadyRegistered) throw new ApiError(409, "You are already registered for this event.");

    await EventRegistrationModel.register(event_id, user_id, formData);

    const event = await EventModel.getById(event_id);
    if (event && event.club_id) {
      const club = await ClubModel.getByIdWithDetails(event.club_id);
      if (club) {
        const recipients = [club.club_head_id, club.club_mentor_id].filter(Boolean);
        for (const recipientId of recipients) {
          try {
            await NotificationModel.createNotification({
              user_id: recipientId,
              title: 'New Event Registration',
              message: `${formData.full_name || 'A student'} has registered for ${event.title}`,
              type: 'info',
              link: `/events/${event_id}`
            });
          } catch (e) {}
        }
      }
    }
  },

  getUserRegistrations: async (userId, userRole) => {
    return await EventRegistrationModel.myEvents(userId, userRole);
  },

  getAttendees: async (eventId, reqUser) => {
    const event = await EventModel.getById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    if (reqUser.role !== 4) {
      const club = await ClubModel.getByIdWithDetails(event.club_id);
      if (!club) throw new ApiError(404, "Club not found");
      const isClubHead = club.club_head_id === reqUser.id;
      const isClubMentor = club.club_mentor_id === reqUser.id;
      if (!isClubHead && !isClubMentor) {
        throw new ApiError(403, "Access denied. Only Club Head or Mentor can view attendees.");
      }
    }

    return await EventRegistrationModel.getAttendees(eventId);
  }
};

export default eventService;
