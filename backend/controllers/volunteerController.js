import volunteerService from "../services/volunteerService.js";

export const volunteerEvent = async (req, res, next) => {
  try {
    await volunteerService.addVolunteer({
      event_id: req.body.event_id,
      student_id: req.user.id,
      task: req.body.task
    });
    res.json({ success: true, message: "Volunteer added successfully" });
  } catch (err) {
    next(err);
  }
};
