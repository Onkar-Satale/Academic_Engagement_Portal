import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validateRegister = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .matches(/^[a-zA-Z\s.']{2,50}$/).withMessage("Name must only contain letters and spaces (no emojis or special symbols)"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  validateRequest,
];

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

