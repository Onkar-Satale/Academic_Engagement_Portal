import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import { validateCreateClub, validateAddStudent } from "../validators/clubValidator.js";
import {
  createClub,
  getAllClubs,
  getClubById,
  updateClub,
  deleteClub,
  addStudentToClub,
  removeStudentFromClub,
  getClubMembers,
  toggleRegistration,
  getMyEnrolledClubs
} from "../controllers/clubController.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorizeRoles(2, 3, 4),
  validateCreateClub,
  createClub
);

router.get("/", getAllClubs);

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

export default router;
