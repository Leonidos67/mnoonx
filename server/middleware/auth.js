// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // НЕ БЛОКИРУЕМ запрос если нет токена
    if (!authHeader) {
      req.userId = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const raw = decoded.userId;
    req.userId = raw != null ? String(raw) : null;
    next();
  } catch (error) {
    // При любой ошибке токена - просто продолжаем без userId
    req.userId = null;
    next();
  }
};