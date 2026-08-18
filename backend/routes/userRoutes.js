import express from "express";
import { 
  getRoles, 
  getAllUsers, 
  deleteUser, 
  toggleUserStatus,
  updateUserRole, 
  deleteAccount, 
  getAuthoritySeats,
  updateAuthoritySeats,
  getProfile,
  getMyAuthorityHistory,
  toggleSelfRetired,
  adminToggleUserRetired,
  toggleSelfPassout,
  adminToggleUserPassout,
  batchGraduateFinalYear,
  batchPromoteAcademicYears
} from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/roles", getRoles);
router.get("/profile", authenticate, getProfile);
router.get("/authority-history", authenticate, getMyAuthorityHistory);
router.patch("/me/toggle-retired", authenticate, toggleSelfRetired);
router.patch("/me/toggle-passout", authenticate, toggleSelfPassout);

router.get("/authority-seats", authenticate, authorizeRoles(3), getAuthoritySeats);
router.put("/authority-seats", authenticate, authorizeRoles(3), updateAuthoritySeats);

router.post("/batch-graduate", authenticate, authorizeRoles(3), batchGraduateFinalYear);
router.post("/batch-promote", authenticate, authorizeRoles(3), batchPromoteAcademicYears);

router.get("/", authenticate, authorizeRoles(3), getAllUsers);
router.patch("/:id/role", authenticate, authorizeRoles(3), updateUserRole);
router.patch("/:id/toggle-status", authenticate, authorizeRoles(3), toggleUserStatus);
router.patch("/:id/toggle-retired", authenticate, authorizeRoles(3), adminToggleUserRetired);
router.patch("/:id/toggle-passout", authenticate, authorizeRoles(3), adminToggleUserPassout);
router.delete("/me", authenticate, deleteAccount);
router.delete("/:id", authenticate, authorizeRoles(3), deleteUser);

export default router;
