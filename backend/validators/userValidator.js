import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validateGenerateKey = [
  body("role_id").notEmpty().withMessage("role_id is required to generate a secret key"),
  validateRequest,
];

