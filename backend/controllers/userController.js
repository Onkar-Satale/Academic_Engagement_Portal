import userService from "../services/userService.js";

export const getRoles = async (req, res, next) => {
  try {
    const roles = await userService.getAllRoles();
    res.json(roles);
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const data = await userService.getProfile(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getMyAuthorityHistory = async (req, res, next) => {
  try {
    const data = await userService.getMyAuthorityHistory(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    await userService.deleteUserById(req.user.id, targetUserId);
    res.json({ success: true, message: "User deleted successfully 🗑️" });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const result = await userService.toggleUserStatus(req.user.id, targetUserId);
    res.json({
      success: true,
      message: `User account has been ${result.is_active === 1 ? 'activated' : 'deactivated'} successfully.`,
      user: result
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const { role_id } = req.body;
    const updated = await userService.adminUpdateUserRole(req.user.id, targetUserId, role_id);
    res.json({
      success: true,
      message: "User role updated successfully ⚡",
      user: updated
    });
  } catch (err) {
    next(err);
  }
};

export const getAuthoritySeats = async (req, res, next) => {
  try {
    const data = await userService.getAuthoritySeats();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateAuthoritySeats = async (req, res, next) => {
  try {
    const result = await userService.updateAuthoritySeats(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    await userService.deleteAccount(req.user.id);
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const toggleSelfRetired = async (req, res, next) => {
  try {
    const updated = await userService.toggleSelfRetiredStatus(req.user.id);
    res.json({
      success: true,
      message: `Status updated to ${updated.is_retired === 1 ? 'Retired' : 'Active'} Faculty.`,
      user: updated
    });
  } catch (err) {
    next(err);
  }
};

export const adminToggleUserRetired = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const updated = await userService.adminToggleUserRetiredStatus(req.user.id, targetUserId);
    res.json({
      success: true,
      message: `User status tag updated to ${updated.is_retired === 1 ? 'Retired' : 'Active'} Faculty.`,
      user: updated
    });
  } catch (err) {
    next(err);
  }
};

export const toggleSelfPassout = async (req, res, next) => {
  try {
    const updated = await userService.toggleSelfPassoutStatus(req.user.id);
    res.json({
      success: true,
      message: `Status updated to ${updated.is_passout === 1 ? 'Passout / Alumni' : 'Active Student'}.`,
      user: updated
    });
  } catch (err) {
    next(err);
  }
};

export const adminToggleUserPassout = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const updated = await userService.adminToggleUserPassoutStatus(req.user.id, targetUserId);
    res.json({
      success: true,
      message: `Student status updated to ${updated.is_passout === 1 ? 'Passout / Alumni' : 'Active Student'}.`,
      user: updated
    });
  } catch (err) {
    next(err);
  }
};

export const batchGraduateFinalYear = async (req, res, next) => {
  try {
    const { department } = req.body;
    const result = await userService.batchGraduateFinalYear(req.user.id, department);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const batchPromoteAcademicYears = async (req, res, next) => {
  try {
    const result = await userService.batchPromoteAcademicYears(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};


