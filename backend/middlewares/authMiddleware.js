import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { UserModel } from "../models/userModel.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "No Bearer token provided"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new ApiError(401, "No token found in Bearer string"));
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      return next(new ApiError(500, "JWT_ACCESS_SECRET is not configured in environment variables"));
    }
    const decoded = jwt.verify(token, secret);

    // Verify user still exists in the database
    const activeUser = await UserModel.findById(decoded.id);

    if (!activeUser) {
      return next(new ApiError(401, "User account has been deleted or no longer exists"));
    }

    req.userId = decoded.id;
    req.user = {
      id: decoded.id,
      role: Number(activeUser.role_id || decoded.role_id)
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired - Please log in again"));
    }
    return next(new ApiError(401, "Invalid or expired token"));
  }
};
