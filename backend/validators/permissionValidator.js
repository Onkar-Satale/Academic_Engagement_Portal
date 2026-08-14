import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";

export const validatePermissionRequest = [
  body("title").notEmpty().withMessage("Permission request title is required").isString(),
  body("event_date").notEmpty().withMessage("event_date is required"),
  body("venue").notEmpty().withMessage("venue is required").isString(),
  body("club_id").notEmpty().withMessage("club_id is required"),
  validateRequest,
];

export const validateApprovalAction = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["approved", "rejected"])
    .withMessage("Valid status ('approved' or 'rejected') is required"),
  validateRequest,
];

