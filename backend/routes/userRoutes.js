import express from "express";
import { getRoles, deleteAccount, generateRoleKey, revokeSecretKey, getAllSecretKeys } from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/roles", getRoles);
router.delete("/me", authenticate, deleteAccount);
router.post("/generate-key", authenticate, authorizeRoles(3), generateRoleKey);
router.post("/revoke-key", authenticate, authorizeRoles(3), revokeSecretKey);
router.get("/secret-keys", authenticate, authorizeRoles(3), getAllSecretKeys);

export default router;
