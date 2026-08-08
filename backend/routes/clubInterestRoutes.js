import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { expressInterest, getMyInterests } from "../controllers/clubInterestController.js";

const router = express.Router();

router.use(authenticate);

router.post("/", expressInterest);
router.get("/my-interests", getMyInterests);

export default router;
