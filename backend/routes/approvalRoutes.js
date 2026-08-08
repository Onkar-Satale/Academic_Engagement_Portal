import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validateAddApproval } from "../validators/approvalValidator.js";
import { addApproval, getApprovals } from "../controllers/approvalController.js";

const router = express.Router();

router.post("/", authenticate, authorizeRoles(2, 3, 4), validateAddApproval, addApproval);
router.get("/:eventId", authenticate, getApprovals);

export default router;
