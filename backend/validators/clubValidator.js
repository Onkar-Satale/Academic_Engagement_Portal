import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validateCreateClub = [
  body("name").trim().notEmpty().withMessage("Club name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  validateRequest,
];

export const validateAddStudent = [
  body("name").notEmpty().withMessage("Student name is required").isString(),
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
  validateRequest,
];

