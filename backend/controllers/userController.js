import crypto from "crypto";
import userService from "../services/userService.js";
import { RoleKeyModel } from "../models/roleKeyModel.js";
import { ClubModel } from "../models/clubModel.js";

export const getRoles = async (req, res, next) => {
  try {
    const roles = await userService.getAllRoles();
    res.json(roles);
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    await userService.deleteAccount(req.user.id);
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const generateRoleKey = async (req, res, next) => {
  try {
    const { role_id, secret_key } = req.body;
    if (!role_id) return res.status(400).json({ success: false, message: "role_id is required" });

    if (!secret_key || !secret_key.trim()) {
      return res.status(400).json({
        success: false,
        message: "A secret key must be generated or provided before activating."
      });
    }

    const existingKey = await RoleKeyModel.findActiveByRole(role_id);
    if (existingKey) {
      return res.status(400).json({
        success: false,
        message: `A secret key record ('${existingKey.secret_key}') already exists for this role. Delete the existing key record first before creating a new key.`
      });
    }

    const keyToUse = secret_key.trim();
    const keyId = await RoleKeyModel.create({ secret_key: keyToUse, role_id });

    res.status(201).json({
      success: true,
      message: "Role invite key generated successfully",
      key_id: keyId,
      secret_key: keyToUse,
      role_id
    });
  } catch (err) {
    next(err);
  }
};

export const revokeSecretKey = async (req, res, next) => {
  try {
    const { secret_key } = req.body;
    if (!secret_key) return res.status(400).json({ message: "secret_key is required" });

    const roleRevoked = await RoleKeyModel.revokeKey(secret_key);
    const clubRevoked = await ClubModel.revokeClubKey(secret_key);

    if (!roleRevoked && !clubRevoked) {
      return res.status(404).json({ success: false, message: "Secret key not found or already revoked" });
    }

    res.json({
      success: true,
      message: `Secret key '${secret_key}' has been revoked successfully`
    });
  } catch (err) {
    next(err);
  }
};

export const getAllSecretKeys = async (req, res, next) => {
  try {
    const keys = await RoleKeyModel.getAllKeys();
    res.json(keys);
  } catch (err) {
    next(err);
  }
};
