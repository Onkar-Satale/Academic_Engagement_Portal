import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validateCreateClub = [
  body("name")
    .trim()
    .notEmpty().withMessage("Club name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Club name must be between 2 and 100 characters"),
  body("description")
    .trim()
    .notEmpty().withMessage("Description is required")
    .isLength({ min: 10, max: 2000 }).withMessage("Description must be at least 10 characters"),
  validateRequest,
];

export const validateAddStudent = [
  body("name")
    .trim()
    .notEmpty().withMessage("Student name is required")
    .matches(/^[a-zA-Z\s.']{2,50}$/).withMessage("Student name must only contain letters and spaces (no emojis or special characters)"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
  body("roll_no")
    .optional({ checkFalsy: true })
    .matches(/^\d{5}$/).withMessage("Roll number must be exactly 5 digits (e.g. 31105)"),
  validateRequest,
];

