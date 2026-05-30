const jwt = require('jsonwebtoken');
const dispatcherRepository = require('../repository/dispatcher-repository');
const customerRepository = require('../repository/customer-repository');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload expected to contain { sub, role }
    req.auth = payload;

    // attach full profile for convenience
    if (payload.role === 'dispatcher') {
      req.dispatcher = await dispatcherRepository.findById(payload.sub);
    }

    if (payload.role === 'user') {
      req.customer = await customerRepository.findById(payload.sub);
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.auth || req.auth.role !== role) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return next();
};

module.exports = {
  authMiddleware,
  requireRole,
};
