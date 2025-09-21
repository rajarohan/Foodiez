const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

// Protect routes - general authentication
const protect = async (req, res, next) => {
  let token;

  // Check for token in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
      } else if (decoded.role === 'customer') {
        req.user = await Customer.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      req.userRole = decoded.role;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (req.user && req.userRole === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
};

// Customer only access
const customerOnly = (req, res, next) => {
  if (req.user && req.userRole === 'customer') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Customer access required',
    });
  }
};

// Allow both admin and customer access
const allowBoth = (req, res, next) => {
  if (req.user && (req.userRole === 'admin' || req.userRole === 'customer')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Authentication required',
    });
  }
};

module.exports = {
  protect,
  adminOnly,
  customerOnly,
  allowBoth,
};