import permissionService from "../services/permissionService.js";

export const createPermissionRequest = async (req, res, next) => {
  try {
    const { title, description, event_date, venue, club_id } = req.body;
    const requester_id = req.user.id;

    if (!title || !event_date || !venue || !club_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const requestId = await permissionService.createRequest({
      title,
      description,
      event_date,
      venue,
      club_id,
      requester_id
    });

    res.status(201).json({ success: true, message: "Permission request created successfully", requestId });
  } catch (err) {
    next(err);
  }
};

export const getMyPermissionRequests = async (req, res, next) => {
  try {
    const requests = await permissionService.getUserRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

export const getPendingApprovals = async (req, res, next) => {
  try {
    const requests = await permissionService.getPendingForAuthority(req.user.role, req.user.id);
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

export const handleApprovalAction = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status, remarks, level } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status action" });
    }

    await permissionService.updateStatus(
      requestId,
      req.user.id,
      level || 1,
      status,
      remarks
    );

    res.json({ success: true, message: `Permission request ${status} successfully` });
  } catch (err) {
    next(err);
  }
};
