import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.js';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    // Check if token is empty
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is empty.'
      });
    }

    console.log('Token received:', token.substring(0, 20) + '...'); // Log first 20 chars for debugging

    // Verify token
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);
    
    if (error.name === 'JsonWebTokenError') {
      if (error.message === 'jwt malformed') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format. Please log in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
    }

    console.error('Unexpected auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in authentication'
    });
  }
};