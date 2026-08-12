import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validateVolunteerEvent } from "../validators/volunteerValidator.js";
import { volunteerEvent } from "../controllers/volunteerController.js";

const router = express.Router();

router.post("/", authenticate, validateVolunteerEvent, volunteerEvent);

export default router;
