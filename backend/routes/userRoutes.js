import express from "express";
import { getRoles, getAllUsers, deleteUser, elevateRole, updateUserRole, deleteAccount, generateRoleKey, revokeSecretKey, getAllSecretKeys } from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validateGenerateKey } from "../validators/userValidator.js";

const router = express.Router();

router.get("/roles", getRoles);
router.get("/", authenticate, authorizeRoles(3), getAllUsers);
router.post("/elevate-role", authenticate, elevateRole);
router.patch("/:id/role", authenticate, authorizeRoles(3), updateUserRole);
router.delete("/me", authenticate, deleteAccount);
router.delete("/:id", authenticate, authorizeRoles(3), deleteUser);
router.post("/generate-key", authenticate, authorizeRoles(3), validateGenerateKey, generateRoleKey);
router.post("/revoke-key", authenticate, authorizeRoles(3), revokeSecretKey);
router.get("/secret-keys", authenticate, authorizeRoles(3), getAllSecretKeys);

export default router;
