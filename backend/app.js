import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import clubMemberRoutes from "./routes/clubMemberRoutes.js";
import eventRegistrationRoutes from "./routes/eventRegistrationRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { rateLimitMiddleware } from "./middlewares/rateLimitMiddleware.js";
import { sanitizeMiddleware } from "./middlewares/sanitizeMiddleware.js";

dotenv.config();

const app = express();

// Security Headers & Logging
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));
app.use(rateLimitMiddleware);

const allowedOrigins = process.env.ALLOWED_ORIGINS;
const frontendUrl = process.env.FRONTEND_URL;
const allowedOriginsList = allowedOrigins
  ? allowedOrigins.split(",").map((origin) => origin.trim())
  : [];

if (frontendUrl && !allowedOriginsList.includes(frontendUrl.trim())) {
  allowedOriginsList.push(frontendUrl.trim());
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOriginsList.length === 0 ||
        allowedOriginsList.includes(origin) ||
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation: Origin not allowed"));
      }
    },
    credentials: true
  })
);
app.use(express.json());
app.use(sanitizeMiddleware);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/club-members", clubMemberRoutes);
app.use("/api/event-registrations", eventRegistrationRoutes);
app.use("/api/feedbacks", feedbackRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Academic Engagement Portal Backend API Server is running securely" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Academic Engagement Portal Backend API Server is operational" });
});

app.use(errorMiddleware);

export default app;
