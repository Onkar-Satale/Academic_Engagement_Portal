import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validateCreateEvent } from "../validators/eventValidator.js";
import { createEvent, getEvents, getEventById, deleteEvent, updateEvent } from "../controllers/eventController.js";

const router = express.Router();

router.post("/", authenticate, validateCreateEvent, createEvent);
router.get("/", getEvents);
router.get("/:eventId", getEventById);
router.put("/:eventId", authenticate, updateEvent);
router.delete("/:eventId", authenticate, deleteEvent);

export default router;
