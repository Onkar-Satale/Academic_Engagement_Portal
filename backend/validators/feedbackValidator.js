import ApiError from "../utils/ApiError.js";

export const validateCreateFeedback = (req, res, next) => {
  const { message } = req.body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return next(new ApiError(400, "Feedback message is required"));
  }
  next();
};
