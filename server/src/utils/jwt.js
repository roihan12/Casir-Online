const jwt = require("jsonwebtoken");

// JWT_SECRET must be defined - no fallback for security
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable must be defined. " +
    "Please set it in your .env file with a strong, random secret."
  );
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },
  verifyToken: (token) => {
    return jwt.verify(token, JWT_SECRET);
  },
};
