// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function authMiddleware(requiredRoles = []) {
  // allow calling without args: auth()
  if (typeof requiredRoles === 'string') requiredRoles = [requiredRoles];

  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization required' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // { id, email, role }
      if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};
