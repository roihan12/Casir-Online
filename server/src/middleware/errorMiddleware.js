const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");

const errorMiddleware = async (err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  // Log error with request context for debugging
  logger.error("Request error", {
    error: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
  });

  if (err instanceof ResponseError) {
    res
      .status(err.status)
      .json({
        success: false,
        errors: err.message,
      })
      .end();
  } else {
    // For unexpected errors, hide details in production
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message;

    res
      .status(500)
      .json({
        success: false,
        errors: message,
      })
      .end();
  }
};

module.exports = { errorMiddleware };
