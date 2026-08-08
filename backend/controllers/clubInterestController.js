import clubService from "../services/clubService.js";

export const expressInterest = async (req, res, next) => {
  try {
    await clubService.expressInterest(req.user.id, req.body.club_id);
    res.status(201).json({ success: true, message: "Expressed interest in club" });
  } catch (err) {
    next(err);
  }
};

export const getMyInterests = async (req, res, next) => {
  try {
    const interests = await clubService.getUserInterests(req.user.id);
    res.json(interests);
  } catch (err) {
    next(err);
  }
};
