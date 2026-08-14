import eventService from "../services/eventService.js";
import ApiError from "../utils/ApiError.js";

export const createEvent = async (req, res, next) => {
  try {
    await eventService.createEvent(req.user, req.body);
    res.status(201).json({ success: true, message: "Event created successfully" });
  } catch (err) {
    next(err);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const events = await eventService.getAllEvents();
    res.json(events);
  } catch (err) {
    next(err);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.eventId);
    if (!event) return next(new ApiError(404, "Event not found"));
    res.json(event);
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const result = await eventService.deleteEvent(req.params.eventId, req.user);
    if (result.status !== 200) return next(new ApiError(result.status, result.message));
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const result = await eventService.updateEvent(req.params.eventId, req.user, req.body);
    if (result.status !== 200) return next(new ApiError(result.status, result.message));
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};
