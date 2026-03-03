const { ResponseError } = require("../error/responseError");
const { logger } = require("../utils/logger");

const errorMiddleware = async (err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  // Always log to console for immediate visibility in terminal
  console.error("\n========== ERROR ==========");
  console.error("Path:", req.method, req.path);
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  console.error("User ID:", req.user?.id);
  console.error("===========================\n");

  // Log error with request context for debugging (also goes to file)
  logger.error("Request error", {
    error: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
  });

  // Handle Prisma-specific errors
  if (err.code === "P2002") {
    // Unique constraint violation
    const field = err.meta?.target?.[0] || "field";
    return res
      .status(409)
      .json({
        success: false,
        message: `${field} already exists`,
      })
      .end();
  }

  if (err instanceof ResponseError) {
    res
      .status(err.status)
      .json({
        success: false,
        message: err.message,
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
        message: message,
      })
      .end();
  }
};

module.exports = { errorMiddleware };
