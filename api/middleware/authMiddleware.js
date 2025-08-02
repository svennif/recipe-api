import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      await logger.warn('Access denied - no token provided', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    await logger.info('User authenticated successfully', {
      userId: decoded.id,
      email: decoded.email,
      path: req.path
    });

    next();
  } catch (err) {
    await logger.warn('Invalid token provided', {
      error: err.message,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(403).json({
      message: 'Invalid token.'
    });
  }
}