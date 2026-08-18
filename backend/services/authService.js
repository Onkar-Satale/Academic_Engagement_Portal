import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";
import { RoleModel } from "../models/roleModel.js";
import { ClubModel } from "../models/clubModel.js";
import ApiError from "../utils/ApiError.js";

export const authService = {
  registerUser: async ({ name, email, password, department, year, role_id, secret_key }) => {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new ApiError(400, "Email is already registered");

    const role = await RoleModel.getById(role_id);
    if (!role) throw new ApiError(400, "Invalid role");

    const roleName = role.role_name;

    if (roleName === "Club Head") {
      throw new ApiError(400, "Please register as a Student. Club Heads are appointed directly inside Club settings.");
    } else if (roleName === "Club Mentor") {
      throw new ApiError(400, "Please register as a Teacher/Faculty. Club Mentors are appointed directly inside Club settings.");
    } else if (["Estate Manager", "Principal", "Director"].includes(roleName)) {
      throw new ApiError(400, `Please register as Teacher/Faculty. ${roleName} is appointed directly by the Administrator.`);
    } else if (roleName === "Admin") {
      const requiredAdminKey = (process.env.SYSTEM_ADMIN_SECRET_KEY || "").trim().replace(/^["']|["']$/g, "");
      const cleanSecretKey = (secret_key || "").trim().replace(/^["']|["']$/g, "");

      if (!requiredAdminKey) {
        throw new ApiError(500, "SYSTEM_ADMIN_SECRET_KEY environment variable is not configured on the server");
      }
      if (!cleanSecretKey || cleanSecretKey !== requiredAdminKey) {
        throw new ApiError(400, "Invalid Admin Secret Key.");
      }
    }

    const userId = await UserModel.create({ name, email, password, department, year, role_id });

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
      throw new ApiError(500, "JWT_ACCESS_SECRET is not configured in environment variables");
    }
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "1d";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    const token = jwt.sign({ id: userId, role_id }, accessSecret, { expiresIn: accessExpiresIn });
    const refreshToken = jwt.sign({ id: userId, role_id }, refreshSecret, { expiresIn: refreshExpiresIn });

    return {
      token,
      refreshToken,
      user: {
        id: userId,
        user_id: userId,
        name,
        email,
        department,
        year,
        role_id,
        role_name: roleName,
        club_id: null
      }
    };
  },

  loginUser: async (email, password) => {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new ApiError(401, "Invalid credentials");

    if (user.is_active === 0 || user.is_active === false) {
      throw new ApiError(403, "Your account has been deactivated by the Administrator. Please contact administration.");
    }

    const isMatch = await UserModel.verifyPassword(password, user.password_hash);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
      throw new ApiError(500, "JWT_ACCESS_SECRET is not configured in environment variables");
    }
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "1d";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    const token = jwt.sign({ id: user.user_id, role_id: user.role_id }, accessSecret, { expiresIn: accessExpiresIn });
    const refreshToken = jwt.sign({ id: user.user_id, role_id: user.role_id }, refreshSecret, { expiresIn: refreshExpiresIn });

    let club_id = null;
    if (user.role_name === "Club Head" || user.role_name === "Club Mentor" || user.role_id === 4 || user.role_id === 5) {
      club_id = await ClubModel.findByUserRole(user.user_id);
    }

    return {
      token,
      refreshToken,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        role_id: user.role_id,
        role_name: user.role_name,
        club_id
      }
    };
  },

  refreshToken: async (providedRefreshToken) => {
    if (!providedRefreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(providedRefreshToken, refreshSecret);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, "User not found. Please log in again.");
    }

    if (user.is_active === 0 || user.is_active === false) {
      throw new ApiError(403, "Your account has been deactivated by the Administrator.");
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "1d";
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    const token = jwt.sign({ id: user.user_id, role_id: user.role_id }, accessSecret, { expiresIn: accessExpiresIn });
    const newRefreshToken = jwt.sign({ id: user.user_id, role_id: user.role_id }, refreshSecret, { expiresIn: refreshExpiresIn });

    let club_id = null;
    if (user.role_id === 4 || user.role_id === 5) {
      club_id = await ClubModel.findByUserRole(user.user_id);
    }

    return {
      token,
      refreshToken: newRefreshToken,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        role_id: user.role_id,
        role_name: user.role_name,
        club_id
      }
    };
  }
};

export default authService;
