const authService = require("../services/authService");
const userService = require("../services/userService");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const result = await authService.login(
      username,
      password,
      ipAddress,
      userAgent
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("auth_token", result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 86400000,
    });

    if (result.sessionId) {
      res.cookie("session_id", result.sessionId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
        maxAge: 86400000,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

const logout = async (req, res) => {
  try {
    // Get session ID from cookie instead of request object
    const sessionId = req.cookies.session_id;

    if (sessionId) {
      await authService.logout(sessionId);
    }

    // Clear the cookies
    res.clearCookie("auth_token", { path: "/" });
    res.clearCookie("session_id", { path: "/" });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed",
    });
  }
};

const getProfile = async (req, res, next) => {
  try {
    // Assuming middleware has already verified the token and attached user to req
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userProfile = await authService.getProfile(user.id);

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const updatedUser = await userService.updateUser(
      userId,
      userData,
      auditInfo,
      null // no avatar for this route
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfileWithAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userData = req.body;
    const avatar = req.file || null;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const updatedUser = await userService.updateUser(
      userId,
      userData,
      auditInfo,
      avatar
    );

    return res.status(200).json({
      success: true,
      message: "Profile and avatar updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getProfile,
  updateProfile,
  updateProfileWithAvatar,
};
