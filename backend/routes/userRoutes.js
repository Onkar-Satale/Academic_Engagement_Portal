import express from "express";
import { 
  getRoles, 
  getAllUsers, 
  deleteUser, 
  updateUserRole, 
  deleteAccount, 
  getAuthoritySeats, 
  updateAuthoritySeats, 
  getProfile, 
  getMyAuthorityHistory 
} from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/roles", getRoles);
router.get("/profile", authenticate, getProfile);
router.get("/authority-history", authenticate, getMyAuthorityHistory);

router.get("/authority-seats", authenticate, authorizeRoles(3), getAuthoritySeats);
router.put("/authority-seats", authenticate, authorizeRoles(3), updateAuthoritySeats);

router.get("/", authenticate, authorizeRoles(3), getAllUsers);
router.patch("/:id/role", authenticate, authorizeRoles(3), updateUserRole);
router.delete("/me", authenticate, deleteAccount);
router.delete("/:id", authenticate, authorizeRoles(3), deleteUser);

export default router;
