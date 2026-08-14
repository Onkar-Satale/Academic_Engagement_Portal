import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validateVolunteerEvent = [
  body("event_id").notEmpty().withMessage("event_id is required to register as a volunteer"),
  validateRequest,
];

