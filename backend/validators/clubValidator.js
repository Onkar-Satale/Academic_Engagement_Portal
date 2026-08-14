import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validateCreateClub = [
  body("name").notEmpty().withMessage("Club name is required").isString(),
  body("description").notEmpty().withMessage("Description is required").isString(),
  body("secretKey").notEmpty().withMessage("secretKey is required").isString(),
  validateRequest,
];

export const validateAddStudent = [
  body("name").notEmpty().withMessage("Student name is required").isString(),
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
  validateRequest,
];

