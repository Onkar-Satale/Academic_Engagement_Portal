import { approvalService } from "../services/approvalService.js";
import ApiError from "../utils/ApiError.js";

export const addApproval = async (req, res, next) => {
  try {
    const { event_id, status, remarks } = req.body;
    const authorityId = req.userId;

    if (!event_id || !status) {
      return next(new ApiError(400, "event_id and status are required"));
    }

    const approvalId = await approvalService.addApproval(event_id, authorityId, status, remarks);
    return res.status(201).json({
      success: true,
      message: "Approval recorded successfully",
      approval_id: approvalId
    });
  } catch (err) {
    next(err);
  }
};

export const getApprovals = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const approvals = await approvalService.getApprovals(eventId);
    return res.json({
      success: true,
      approvals
    });
  } catch (err) {
    next(err);
  }
};
