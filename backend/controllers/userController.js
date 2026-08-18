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
