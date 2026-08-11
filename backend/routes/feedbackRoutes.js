import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { createFeedback, getAllFeedbacks, deleteFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

router.get("/", getAllFeedbacks);
router.post("/", authenticate, createFeedback);
router.delete("/:id", authenticate, deleteFeedback);

export default router;
