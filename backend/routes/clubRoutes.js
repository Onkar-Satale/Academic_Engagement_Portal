import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validateCreateClub, validateAddStudent } from "../validators/clubValidator.js";
import {
  createClub,
  getAllClubs,
  getClubById,
  getCandidates,
  updateClub,
  deleteClub,
  addStudentToClub,
  removeStudentFromClub,
  getClubMembers,
  toggleRegistration,
  getMyEnrolledClubs
} from "../controllers/clubController.js";
import { joinClub, getPendingApplications, processApplication, getMemberStatus } from "../controllers/clubMemberController.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeRoles(3),
  validateCreateClub,
  createClub
);

router.get("/", getAllClubs);

router.get(
  "/candidates",
  authenticate,
  getCandidates
);

router.get(
  "/my/enrolled",
  authenticate,
  getMyEnrolledClubs
);

router.get("/:id", getClubById);

router.put(
  "/:id",
  authenticate,
  updateClub
);

router.delete(
  "/:id",
  authenticate,
  deleteClub
);

router.post(
  "/:clubId/add-student",
  authenticate,
  validateAddStudent,
  addStudentToClub
);

router.delete(
  "/:clubId/remove-student",
  authenticate,
  removeStudentFromClub
);

router.get(
  "/:clubId/members",
  authenticate,
  getClubMembers
);

router.put(
  "/:clubId/toggle-registration",
  authenticate,
  toggleRegistration
);

router.post(
  "/:clubId/join",
  authenticate,
  joinClub
);

router.get(
  "/:clubId/applications",
  authenticate,
  getPendingApplications
);

router.post(
  "/:clubId/applications/:userId",
  authenticate,
  processApplication
);

router.get(
  "/:clubId/my-status",
  authenticate,
  getMemberStatus
);

export default router;
