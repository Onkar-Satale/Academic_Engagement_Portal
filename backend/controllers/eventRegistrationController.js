import eventService from "../services/eventService.js";

export const registerEvent = async (req, res, next) => {
  try {
    await eventService.registerForEvent(req.user.id, req.body);
    res.json({ success: true, message: "Event registration confirmed and approved automatically." });
  } catch (err) {
    next(err);
  }
};

export const myRegistrations = async (req, res, next) => {
  try {
    const list = await eventService.getUserRegistrations(req.user.id, req.user.role);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const getEventAttendees = async (req, res, next) => {
  try {
    const attendees = await eventService.getAttendees(req.params.eventId, req.user);
    res.json(attendees);
  } catch (err) {
    next(err);
  }
};
