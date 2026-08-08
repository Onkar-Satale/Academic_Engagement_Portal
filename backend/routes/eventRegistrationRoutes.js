import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validateRegisterEvent } from "../validators/eventValidator.js";
import {
  registerEvent,
  myRegistrations,
  getEventAttendees
} from "../controllers/eventRegistrationController.js";

const router = express.Router();

router.post("/register", authenticate, validateRegisterEvent, registerEvent);
router.get("/my", authenticate, myRegistrations);
router.get("/:eventId/attendees", authenticate, getEventAttendees);

export default router;
