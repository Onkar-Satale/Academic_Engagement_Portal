import ApiError from "../utils/ApiError.js";

export const validatePermissionRequest = (req, res, next) => {
  const { title, event_date, venue, club_id } = req.body;
  if (!title || !event_date || !venue || !club_id) {
    return next(new ApiError(400, "Permission request title, event_date, venue, and club_id are required"));
  }
  next();
};

export const validateApprovalAction = (req, res, next) => {
  const { status } = req.body;
  if (!status || !["approved", "rejected"].includes(status)) {
    return next(new ApiError(400, "Valid status ('approved' or 'rejected') is required"));
  }
  next();
};
