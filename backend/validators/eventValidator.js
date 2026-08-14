import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validateCreateEvent = [
  body("title").notEmpty().withMessage("Event title is required").isString(),
  body("date").notEmpty().withMessage("Event date is required"),
  body("venue").notEmpty().withMessage("Venue is required").isString(),
  validateRequest,
];

export const validateRegisterEvent = [
  body("event_id").notEmpty().withMessage("event_id is required"),
  body("full_name").notEmpty().withMessage("full_name is required").isString(),
  body("email").notEmpty().withMessage("email is required").isEmail().withMessage("Invalid email format"),
  validateRequest,
];

