import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "No Bearer token provided"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new ApiError(401, "No token found in Bearer string"));
    }

    const secret = process.env.JWT_SECRET || "supersecretkey123";
    const decoded = jwt.verify(token, secret);

    req.userId = decoded.id;
    req.user = {
      id: decoded.id,
      role: Number(decoded.role_id)
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired - Please log in again"));
    }
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

export const authenticate = authMiddleware;
export default authMiddleware;
