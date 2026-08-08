import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { joinClub, leaveClub } from "../controllers/clubMemberController.js";

const router = express.Router();

router.use(authenticate);

router.post("/register", joinClub);
router.post("/unregister", leaveClub);

export default router;
