import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";
import { RoleModel } from "../models/roleModel.js";
import { ClubModel } from "../models/clubModel.js";
import { RoleKeyModel } from "../models/roleKeyModel.js";
import { NotificationModel } from "../models/notificationModel.js";
import ApiError from "../utils/ApiError.js";

export const authService = {
  registerUser: async ({ name, email, password, department, year, role_id, secret_key }) => {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new ApiError(400, "Email is already registered");

    const role = await RoleModel.getById(role_id);
    if (!role) throw new ApiError(400, "Invalid role");

    const roleName = role.role_name;

    if (roleName === "Club Head") {
      if (!secret_key) throw new ApiError(400, "Club Head Secret Key is required");
      const club = await ClubModel.findByKey(secret_key);
      if (!club) throw new ApiError(400, "Invalid Club Head Key");
    } else if (roleName === "Club Mentor") {
      if (!secret_key) throw new ApiError(400, "Club Mentor Secret Key is required");
      const club = await ClubModel.findByKey(secret_key);
      if (!club) throw new ApiError(400, "Invalid Club Mentor Key");
    } else if (roleName === "Admin") {
      const requiredAdminKey = process.env.SYSTEM_ADMIN_SECRET_KEY;
      if (!requiredAdminKey) {
        throw new ApiError(500, "SYSTEM_ADMIN_SECRET_KEY environment variable is not configured on the server");
      }
      if (!secret_key || secret_key !== requiredAdminKey) {
        throw new ApiError(400, "Invalid Admin Secret Key.");
      }
    } else if (["Estate Manager", "Principal", "Director"].includes(roleName)) {
      if (!secret_key) throw new ApiError(400, `${roleName} Secret Key is required`);
      
      // Allow System Admin master key override OR check database dynamic single-use invite key
      const masterAdminKey = process.env.SYSTEM_ADMIN_SECRET_KEY;
      if (!masterAdminKey) {
        throw new ApiError(500, "SYSTEM_ADMIN_SECRET_KEY environment variable is not configured on the server");
      }
      if (secret_key !== masterAdminKey) {
        const keyResult = await RoleKeyModel.validateAndConsume(secret_key, role_id);
        if (!keyResult.valid) {
          throw new ApiError(400, keyResult.reason);
        }
      }
    }

    const userId = await UserModel.create({ name, email, password, department, year, role_id });

    let club_id = null;
    if (roleName === "Club Head") {
      club_id = await ClubModel.assignHead(secret_key, userId);
    } else if (roleName === "Club Mentor") {
      club_id = await ClubModel.assignMentor(secret_key, userId);
    }

    // Notify Admins when an authority registers using a secret key
    if (["Estate Manager", "Principal", "Director"].includes(roleName)) {
      try {
        const adminRows = await UserModel.findByRoleId(3);
        for (const admin of adminRows) {
          await NotificationModel.createNotification({
            user_id: admin.user_id,
            title: "🔑 New Authority Registered",
            message: `${name} (${email}) registered as ${roleName} using a secret key.`,
            type: "info",
            link: "/account"
          });
        }
      } catch (nErr) {
        console.warn("Notification error in registerUser:", nErr);
      }
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
      throw new ApiError(500, "JWT secret (JWT_ACCESS_SECRET or JWT_SECRET) is not configured in environment variables");
    }
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "1h";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || accessSecret;
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
        club_id
      }
    };
  },

  loginUser: async (email, password) => {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new ApiError(401, "Invalid credentials");

    const isMatch = await UserModel.verifyPassword(password, user.password_hash);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
      throw new ApiError(500, "JWT secret (JWT_ACCESS_SECRET or JWT_SECRET) is not configured in environment variables");
    }
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "1h";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || accessSecret;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    const token = jwt.sign({ id: user.user_id, role_id: user.role_id }, accessSecret, { expiresIn: accessExpiresIn });
    const refreshToken = jwt.sign({ id: user.user_id, role_id: user.role_id }, refreshSecret, { expiresIn: refreshExpiresIn });

    let club_id = null;
    if (user.role_id === 4 || user.role_id === 5) {
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

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "1h";
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
