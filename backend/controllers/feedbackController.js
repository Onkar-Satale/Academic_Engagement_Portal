import FeedbackModel from "../models/feedbackModel.js";
import ApiError from "../utils/ApiError.js";

export const createFeedback = async (req, res, next) => {
  try {
    const { message, rating } = req.body;
    if (!message || !message.trim()) {
      return next(new ApiError(400, "Feedback message is required"));
    }

    const feedbackId = await FeedbackModel.create({
      user_id: req.user.id,
      message: message.trim(),
      rating: rating || 5
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully! Thank you for your thoughts. 🎉",
      feedback_id: feedbackId
    });
  } catch (err) {
    next(err);
  }
};

export const getAllFeedbacks = async (req, res, next) => {
  try {
    const feedbacks = await FeedbackModel.getAll();
    res.json(feedbacks);
  } catch (err) {
    next(err);
  }
};

export const deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const feedback = await FeedbackModel.findById(id);
    if (!feedback) {
      return next(new ApiError(404, "Feedback not found"));
    }

    const isOwner = Number(req.user.id) === Number(feedback.user_id);
    if (!isOwner) {
      return next(new ApiError(403, "Only the creator of this feedback can delete it"));
    }

    await FeedbackModel.delete(id);
    res.json({
      success: true,
      message: "Feedback deleted successfully! 🗑️"
    });
  } catch (err) {
    next(err);
  }
};
