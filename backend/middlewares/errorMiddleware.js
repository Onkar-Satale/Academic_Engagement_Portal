import ApiError from "../utils/ApiError.js";

export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (err.code === "ER_DUP_ENTRY") {
    error = new ApiError(409, "A record with this entry already exists.");
  } else if (err.code === "ER_NO_REFERENCED_ROW_2") {
    error = new ApiError(400, "Invalid reference error.");
  } else if (err.code === "ER_NO_SUCH_TABLE") {
    error = new ApiError(500, "Database table not found. Please contact administrator.");
  } else if (err.name === "ValidationError") {
    error = new ApiError(400, err.message);
  } else if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token - Please log in again");
  } else if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expired - Please log in again");
  }

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, false, err.stack);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    error: process.env.NODE_ENV === "development" ? error.stack : undefined
  });
};
