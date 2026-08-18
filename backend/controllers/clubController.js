import clubService from "../services/clubService.js";
import ApiError from "../utils/ApiError.js";

export const createClub = async (req, res, next) => {
  try {
    const { name, description, tagline, category, activities, club_head_id, club_mentor_id, permission_emails } = req.body;

    if (!name || !name.trim()) {
      return next(new ApiError(400, "Club name is required"));
    }

    const clubId = await clubService.createClub({
      name: name.trim(),
      description: description ? description.trim() : "",
      tagline: tagline ? tagline.trim() : null,
      category: category ? category.trim() : null,
      activities: activities ? activities.trim() : null,
      club_head_id: club_head_id || null,
      club_mentor_id: club_mentor_id || null,
      permission_emails: permission_emails ? permission_emails.trim() : null
    });

    res.status(201).json({ success: true, message: "Club created successfully", clubId });
  } catch (err) {
    next(err);
  }
};

export const getCandidates = async (req, res, next) => {
  try {
    const candidates = await clubService.getCandidates();
    res.json(candidates);
  } catch (err) {
    next(err);
  }
};

export const getAllClubs = async (req, res, next) => {
  try {
    const clubs = await clubService.getAllClubs();
    res.json(clubs);
  } catch (err) {
    next(err);
  }
};

export const getClubById = async (req, res, next) => {
  try {
    const club = await clubService.getClubById(req.params.id);
    if (!club) return next(new ApiError(404, "Club not found"));
    res.json(club);
  } catch (err) {
    next(err);
  }
};

export const updateClub = async (req, res, next) => {
  try {
    const club = await clubService.getClubById(req.params.id);
    if (!club) return next(new ApiError(404, "Club not found"));

    if (req.user.role !== 3 && req.user.id !== club.club_head_id && req.user.id !== club.club_mentor_id) {
      return next(new ApiError(403, "Forbidden - Only Club Leadership or Admin can edit club"));
    }

    await clubService.updateClub(req.params.id, req.body);
    res.json({ success: true, message: "Club updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const deleteClub = async (req, res, next) => {
  try {
    const club = await clubService.getClubById(req.params.id);
    if (!club) return next(new ApiError(404, "Club not found"));

    if (req.user.role !== 3 && req.user.id !== club.club_head_id && req.user.id !== club.club_mentor_id) {
      return next(new ApiError(403, "Forbidden - Only Club Leadership or Admin can delete club"));
    }

    await clubService.deleteClub(req.params.id);
    res.json({ success: true, message: "Club deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const addStudentToClub = async (req, res, next) => {
  try {
    const added = await clubService.addStudent(req.params.clubId, req.body);
    if (!added) return next(new ApiError(400, "Student already added"));
    res.json({ success: true, message: "Student added successfully" });
  } catch (err) {
    next(err);
  }
};

export const removeStudentFromClub = async (req, res, next) => {
  try {
    const removed = await clubService.removeStudent(req.params.clubId, req.body.email);
    if (!removed) return next(new ApiError(404, "Student not found in this club"));
    res.json({ success: true, message: "Student removed successfully" });
  } catch (err) {
    next(err);
  }
};

export const getClubMembers = async (req, res, next) => {
  try {
    const members = await clubService.getClubMembers(req.params.clubId);
    res.json(members);
  } catch (err) {
    next(err);
  }
};

export const getMyEnrolledClubs = async (req, res, next) => {
  try {
    const clubIds = await clubService.getEnrolledClubs(req.user.id);
    res.json(clubIds);
  } catch (err) {
    next(err);
  }
};

export const toggleRegistration = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { is_registration_open } = req.body;
    const club = await clubService.getClubById(clubId);
    if (!club) return next(new ApiError(404, "Club not found"));

    if (req.user.role !== 3 && req.user.id !== club.club_head_id) {
      return next(new ApiError(403, "Forbidden"));
    }

    await clubService.toggleRegistration(clubId, is_registration_open);
    res.json({ success: true, message: `Registration ${is_registration_open ? 'opened' : 'closed'} successfully` });
  } catch (err) {
    next(err);
  }
};
