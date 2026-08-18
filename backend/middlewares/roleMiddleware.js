import ApiError from "../utils/ApiError.js";
import { RoleModel } from "../models/roleModel.js";

export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Access denied. Authentication required."));
    }

    try {
      const userRoleId = Number(req.user.role || req.user.role_id);
      const userRole = await RoleModel.getById(userRoleId);
      const userRoleName = userRole?.role_name;

      const isAllowed = allowedRoles.some(r => {
        if (typeof r === 'number') {
          return r === userRoleId || (r === 3 && userRoleName === 'Admin');
        }
        if (typeof r === 'string') {
          return r.toLowerCase() === userRoleName?.toLowerCase() || (r === 'Admin' && (userRoleId === 3 || userRoleName === 'Admin'));
        }
        return false;
      });

      if (!isAllowed) {
        return next(new ApiError(403, "Access denied. Insufficient permissions."));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
