import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  joinClub,
  leaveClub,
  myClubs
} from "../controllers/clubMemberController.js";

const router = express.Router();

router.post("/join", authenticate, joinClub);
router.post("/leave", authenticate, leaveClub);
router.get("/my", authenticate, myClubs);

export default router;
