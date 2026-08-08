import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { volunteerEvent } from "../controllers/volunteerController.js";

const router = express.Router();

router.post("/", authenticate, volunteerEvent);

export default router;
