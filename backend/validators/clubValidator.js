import ApiError from "../utils/ApiError.js";

export const validateCreateClub = (req, res, next) => {
  const { name, description, secretKey } = req.body;
  if (!name || !description || !secretKey) {
    return next(new ApiError(400, "Club name, description, and secretKey are required"));
  }
  next();
};

export const validateAddStudent = (req, res, next) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return next(new ApiError(400, "Student name and email are required"));
  }
  next();
};
