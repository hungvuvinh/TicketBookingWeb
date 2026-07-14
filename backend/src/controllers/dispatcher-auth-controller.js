const dispatcherAuthService = require('../services/dispatcher-auth-service');

const register = async (req, res) => {
  try {
    const result = await dispatcherAuthService.register(req.body || {});
    return res.status(201).json({ success: true, message: 'Dispatcher created', data: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const result = await dispatcherAuthService.login(req.body || {});
    return res.status(200).json({ success: true, message: 'Logged in', data: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken || req.headers['x-refresh-token'];
    const result = await dispatcherAuthService.refreshToken(token);
    return res.status(200).json({ success: true, message: 'Token refreshed', data: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = { register, login, refreshToken };
