import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validatePermissionRequest, validateApprovalAction } from "../validators/permissionValidator.js";
import {
  createPermissionRequest,
  getMyPermissionRequests,
  getPendingApprovals,
  handleApprovalAction
} from "../controllers/permissionController.js";

const router = express.Router();

router.use(authenticate);

router.post("/", validatePermissionRequest, createPermissionRequest);
router.get("/my-requests", getMyPermissionRequests);
router.get("/pending", getPendingApprovals);
router.post("/:requestId/action", validateApprovalAction, handleApprovalAction);

export default router;
