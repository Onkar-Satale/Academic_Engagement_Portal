import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";
import { RoleModel } from "../models/roleModel.js";
import { ClubModel } from "../models/clubModel.js";
import { RoleKeyModel } from "../models/roleKeyModel.js";
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
        const { NotificationModel } = await import("../models/notificationModel.js");
        const { db } = await import("../config/db.js");
        const [adminRows] = await db.query("SELECT user_id FROM user WHERE role_id = 3");
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

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new ApiError(500, "JWT secret (JWT_ACCESS_SECRET or JWT_SECRET) is not configured in environment variables");
    }
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
    const token = jwt.sign({ id: userId, role_id }, secret, { expiresIn });

    return {
      token,
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

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new ApiError(500, "JWT secret (JWT_ACCESS_SECRET or JWT_SECRET) is not configured in environment variables");
    }
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
    const token = jwt.sign({ id: user.user_id, role_id: user.role_id }, secret, { expiresIn });

    let club_id = null;
    if (user.role_id === 4 || user.role_id === 5) {
      club_id = await ClubModel.findByUserRole(user.user_id);
    }

    return {
      token,
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
