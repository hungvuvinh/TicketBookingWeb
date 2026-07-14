const authService = require("../services/auth-service");

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body || {});

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error && error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body || {});

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error && error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.headers['x-refresh-token'];
    const result = await authService.refreshToken(token);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const result = await authService.updateCustomerProfile(req.auth?.sub, req.body || {});

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { customer: result },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  updateProfile,
};
