import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validateCreateEvent } from "../validators/eventValidator.js";
import { createEvent, getEvents, getEventById, deleteEvent, updateEvent } from "../controllers/eventController.js";

const router = express.Router();

router.post("/", authenticate, authorizeRoles(2, 3), validateCreateEvent, createEvent);
router.get("/", getEvents);
router.get("/:eventId", getEventById);
router.put("/:eventId", authenticate, updateEvent);
router.delete("/:eventId", authenticate, deleteEvent);

export default router;
