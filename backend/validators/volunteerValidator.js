import ApiError from "../utils/ApiError.js";

export const validateVolunteerEvent = (req, res, next) => {
  const { event_id } = req.body;
  if (!event_id) {
    return next(new ApiError(400, "event_id is required to register as a volunteer"));
  }
  next();
};
