import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import clubMemberRoutes from "./routes/clubMemberRoutes.js";
import clubInterestRoutes from "./routes/clubInterestRoutes.js";
import clubRegistrationRoutes from "./routes/clubRegistrationRoutes.js";
import eventRegistrationRoutes from "./routes/eventRegistrationRoutes.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/club-members", clubMemberRoutes);
app.use("/api/club-interests", clubInterestRoutes);
app.use("/api/club-registrations", clubRegistrationRoutes);
app.use("/api/event-registrations", eventRegistrationRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Academic Engagement Portal Backend API Server is operational" });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Academic Engagement Portal Backend running on port ${PORT}`);
});
