import ApiError from "../utils/ApiError.js";

export const validateAddApproval = (req, res, next) => {
  const { event_id, status } = req.body;
  if (!event_id || !status) {
    return next(new ApiError(400, "event_id and status are required for approval"));
  }
  next();
};
