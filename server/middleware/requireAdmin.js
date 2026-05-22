const jwt = require('jsonwebtoken');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

module.exports = function requireAdmin(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'Требуется авторизация администратора' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ message: 'Требуется авторизация администратора' });
    }
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    req.admin = { username: decoded.username };
    next();
  } catch {
    return res.status(401).json({ message: 'Сессия администратора недействительна' });
  }
};
