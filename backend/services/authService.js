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

    let assignedClub = null;
    if (roleName === "Club Head") {
      if (!secret_key) throw new ApiError(400, "Club Head Secret Key is required");
      const cleanKey = secret_key.trim();
      assignedClub = await ClubModel.findByHeadKey(cleanKey);
      if (!assignedClub || assignedClub.club_head_id) {
        throw new ApiError(400, "This secret key has already been used. Please ask Admin to generate a new key.");
      }
    } else if (roleName === "Club Mentor") {
      if (!secret_key) throw new ApiError(400, "Club Mentor Secret Key is required");
      const cleanKey = secret_key.trim();
      assignedClub = await ClubModel.findByMentorKey(cleanKey);
      if (!assignedClub || assignedClub.club_mentor_id) {
        throw new ApiError(400, "This secret key has already been used. Please ask Admin to generate a new key.");
      }
    } else if (roleName === "Admin") {
      const requiredAdminKey = (process.env.SYSTEM_ADMIN_SECRET_KEY || "").trim().replace(/^["']|["']$/g, "");
      const cleanSecretKey = (secret_key || "").trim().replace(/^["']|["']$/g, "");

      if (!requiredAdminKey) {
        throw new ApiError(500, "SYSTEM_ADMIN_SECRET_KEY environment variable is not configured on the server");
      }
      if (!cleanSecretKey || cleanSecretKey !== requiredAdminKey) {
        throw new ApiError(400, "Invalid Admin Secret Key.");
      }
    } else if (["Estate Manager", "Principal", "Director"].includes(roleName)) {
      const cleanSecretKey = (secret_key || "").trim().replace(/^["']|["']$/g, "");
      if (!cleanSecretKey) throw new ApiError(400, `${roleName} Secret Key is required`);

      const keyResult = await RoleKeyModel.validateAndConsume(cleanSecretKey, role_id);
      if (!keyResult.valid) {
        throw new ApiError(400, keyResult.reason);
      }
    }

    const userId = await UserModel.create({ name, email, password, department, year, role_id });

    let club_id = null;
    if (roleName === "Club Head") {
      club_id = await ClubModel.assignHead(secret_key.trim(), userId);
      if (!club_id && assignedClub) club_id = assignedClub.club_id;
    } else if (roleName === "Club Mentor") {
      club_id = await ClubModel.assignMentor(secret_key.trim(), userId);
      if (!club_id && assignedClub) club_id = assignedClub.club_id;
    }

    // Notify Admins when an authority, Club Head, or Club Mentor registers using a secret key
    if (["Club Head", "Club Mentor", "Estate Manager", "Principal", "Director"].includes(roleName)) {
      try {
        const adminRows = await UserModel.findByRoleId(3);
        for (const admin of adminRows) {
          let title = "🔑 New Authority Registered";
          let message = `${name} (${email}) registered as ${roleName} using a secret key.`;
          let link = "/account";

          if (roleName === "Club Head") {
            title = "👑 New Club Head Registered";
            message = `${name} (${email}) registered as Club Head for "${assignedClub?.name || 'Club'}".`;
            link = club_id ? `/clubs/${club_id}` : "/clubs";
          } else if (roleName === "Club Mentor") {
            title = "🎓 New Club Mentor Registered";
            message = `${name} (${email}) registered as Club Mentor for "${assignedClub?.name || 'Club'}".`;
            link = club_id ? `/clubs/${club_id}` : "/clubs";
          }

          await NotificationModel.createNotification({
            user_id: admin.user_id,
            title,
            message,
            type: "info",
            link
          });
        }
      } catch (nErr) {
        console.warn("Notification error in registerUser:", nErr);
      }
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
      throw new ApiError(500, "JWT_ACCESS_SECRET is not configured in environment variables");
    }
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN;

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
      throw new ApiError(500, "JWT_ACCESS_SECRET is not configured in environment variables");
    }
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN;

    const token = jwt.sign({ id: user.user_id, role_id: user.role_id }, accessSecret, { expiresIn: accessExpiresIn });
    const refreshToken = jwt.sign({ id: user.user_id, role_id: user.role_id }, refreshSecret, { expiresIn: refreshExpiresIn });

    let club_id = null;
    if (user.role_name === "Club Head" || user.role_name === "Club Mentor" || user.role_id === 2 || user.role_id === 4 || user.role_id === 5) {
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
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN;

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
