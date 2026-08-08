import clubService from "../services/clubService.js";

export const joinClub = async (req, res, next) => {
  try {
    await clubService.joinClub(req.body.club_id, req.user.id);
    res.json({ success: true, message: "Joined club successfully" });
  } catch (err) {
    next(err);
  }
};

export const leaveClub = async (req, res, next) => {
  try {
    await clubService.leaveClub(req.body.club_id, req.user.id);
    res.json({ success: true, message: "Left club successfully" });
  } catch (err) {
    next(err);
  }
};

export const myClubs = async (req, res, next) => {
  try {
    const clubs = await clubService.getUserAssociatedClubs(req.user.id, req.user.role_name);
    res.json(clubs);
  } catch (err) {
    next(err);
  }
};
