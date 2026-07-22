// middleware/auth.js
const jwt = require('jsonwebtoken');
const UserSession = require('../models/UserSession');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      req.userId = null;
      req.tokenSid = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      req.userId = null;
      req.tokenSid = null;
      return next();
    }

    if (!JWT_SECRET) {
      req.userId = null;
      req.tokenSid = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose === '2fa') {
      req.userId = null;
      req.tokenSid = null;
      return next();
    }
    const raw = decoded.userId;
    req.userId = raw != null ? String(raw) : null;
    req.tokenSid = decoded.sid ? String(decoded.sid) : null;

    if (req.userId && req.tokenSid) {
      const session = await UserSession.findOne({
        userId: req.userId,
        tokenId: req.tokenSid,
      }).lean();
      if (session?.revokedAt) {
        req.userId = null;
        req.tokenSid = null;
      }
    }

    next();
  } catch (error) {
    req.userId = null;
    req.tokenSid = null;
    next();
  }
};
