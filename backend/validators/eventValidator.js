import ApiError from "../utils/ApiError.js";

export const validateCreateEvent = (req, res, next) => {
  const { title, date, venue } = req.body;
  if (!title || !date || !venue) {
    return next(new ApiError(400, "Event title, date, and venue are required"));
  }
  next();
};

export const validateRegisterEvent = (req, res, next) => {
  const { event_id, full_name, email } = req.body;
  if (!event_id || !full_name || !email) {
    return next(new ApiError(400, "event_id, full_name, and email are required for registration"));
  }
  next();
};
