import express from "express";
import { getRoles, deleteAccount } from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/roles", getRoles);
router.delete("/me", authenticate, deleteAccount);

export default router;
