import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";
import { RoleModel } from "../models/roleModel.js";
import { ClubModel } from "../models/clubModel.js";
import { RoleKeyModel } from "../models/roleKeyModel.js";
import ApiError from "../utils/ApiError.js";

export const authService = {
  findUserByEmail: async (email) => {
    return await UserModel.findByEmail(email);
  },

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
      const requiredAdminKey = process.env.SYSTEM_ADMIN_SECRET_KEY || "SystemAdminSecretKey2026!";
      if (!secret_key || secret_key !== requiredAdminKey) {
        throw new ApiError(400, "Invalid Admin Secret Key.");
      }
    } else if (["Estate Manager", "Principal", "Director"].includes(roleName)) {
      if (!secret_key) throw new ApiError(400, `${roleName} Secret Key is required`);
      
      // Allow System Admin master key override OR check database dynamic single-use invite key
      const masterAdminKey = process.env.SYSTEM_ADMIN_SECRET_KEY || "SystemAdminSecretKey2026!";
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

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "supersecretkey123";
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "15m";
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

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "supersecretkey123";
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "7d";
    const token = jwt.sign({ id: user.user_id, role_id: user.role_id }, secret, { expiresIn });

    let club_id = null;
    if (user.role_id === 2 || user.role_id === 5) {
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
