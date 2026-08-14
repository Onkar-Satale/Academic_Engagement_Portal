import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validateCreateFeedback = [
  body("message").notEmpty().withMessage("Feedback message is required").isString().withMessage("Feedback message must be a string"),
  validateRequest,
];

