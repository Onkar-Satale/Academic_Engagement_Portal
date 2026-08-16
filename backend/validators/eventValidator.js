import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validateCreateEvent = [
  body("title")
    .trim()
    .notEmpty().withMessage("Event title is required")
    .isLength({ min: 3, max: 100 }).withMessage("Event title must be between 3 and 100 characters"),
  body("date").notEmpty().withMessage("Event date is required"),
  body("venue").trim().notEmpty().withMessage("Venue is required"),
  validateRequest,
];

export const validateRegisterEvent = [
  body("event_id").notEmpty().withMessage("event_id is required"),
  body("full_name")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .matches(/^[a-zA-Z\s.']{2,50}$/).withMessage("Name must only contain letters and spaces (no emojis or special characters)"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^[6-9]\d{9}$/).withMessage("Phone number must be exactly 10 valid digits starting with 6, 7, 8, or 9"),
  body("roll_no")
    .trim()
    .notEmpty().withMessage("Roll number is required")
    .matches(/^\d{5}$/).withMessage("Roll number must be exactly 5 digits (e.g. 31105)"),
  validateRequest,
];

