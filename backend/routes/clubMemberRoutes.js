import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  leaveClub,
  myClubs
} from "../controllers/clubMemberController.js";

const router = express.Router();

router.post("/leave", authenticate, leaveClub);
router.get("/my", authenticate, myClubs);

export default router;
