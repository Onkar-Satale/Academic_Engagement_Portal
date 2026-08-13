import ApiError from "../utils/ApiError.js";

export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Access denied. Insufficient permissions."));
    }
    next();
  };
};

