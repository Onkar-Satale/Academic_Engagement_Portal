import express from "express";
import * as authController from "../controllers/authController.js";
import { validateRegister, validateLogin } from "../validators/authValidator.js";
import { authRateLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

router.post("/register", authRateLimiter, validateRegister, authController.register);
router.post("/login", authRateLimiter, validateLogin, authController.login);

export default router;
