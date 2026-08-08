import userService from "../services/userService.js";

export const getRoles = async (req, res, next) => {
  try {
    const roles = await userService.getAllRoles();
    res.json(roles);
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
