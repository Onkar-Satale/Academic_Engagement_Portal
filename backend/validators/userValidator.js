import ApiError from "../utils/ApiError.js";

export const validateGenerateKey = (req, res, next) => {
  const { role_id } = req.body;
  if (!role_id) {
    return next(new ApiError(400, "role_id is required to generate a secret key"));
  }
  next();
};
