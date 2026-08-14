import clubService from "../services/clubService.js";
import ApiError from "../utils/ApiError.js";

export const joinClub = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    if (!clubId) return next(new ApiError(400, "Club ID is required"));
    await clubService.joinClub(clubId, req.user.id, req.body.reason);
    res.json({ success: true, message: "Application submitted successfully! ⏳ Waiting for Club Head approval." });
  } catch (err) {
    next(err);
  }
};

export const getPendingApplications = async (req, res, next) => {
  try {
    const apps = await clubService.getPendingApplications(req.params.clubId);
    res.json(apps);
  } catch (err) {
    next(err);
  }
};

export const processApplication = async (req, res, next) => {
  try {
    const { clubId, userId } = req.params;
    const { action } = req.body;
    await clubService.processApplication(clubId, userId, action);
    res.json({ success: true, message: `Application ${action}d successfully` });
  } catch (err) {
    next(err);
  }
};

export const getMemberStatus = async (req, res, next) => {
  try {
    const status = await clubService.getMemberStatus(req.params.clubId, req.user.id);
    res.json({ status });
  } catch (err) {
    next(err);
  }
};

export const leaveClub = async (req, res, next) => {
  try {
    const { club_id } = req.body;
    if (!club_id) return next(new ApiError(400, "Club ID is required"));
    await clubService.leaveClub(club_id, req.user.id);
    res.json({ success: true, message: "Left club successfully" });
  } catch (err) {
    next(err);
  }
};

export const myClubs = async (req, res, next) => {
  try {
    const clubs = await clubService.getUserAssociatedClubs(req.user.id, req.user.role);
    res.json(clubs);
  } catch (err) {
    next(err);
  }
};
