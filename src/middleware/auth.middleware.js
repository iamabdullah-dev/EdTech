const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    // Add user info to request
    req.user = {
      id: decoded.id,
      userType: decoded.userType || userCheck.rows[0].user_type,
    };
    
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message,
    });
  }
};

// Middleware to authorize specific user types
const authorize = (...userTypes) => {
  return (req, res, next) => {
    if (!req.user || !req.user.userType) {
      return res.status(401).json({
        success: false,
        message: 'User type not found in token',
      });
    }

    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `User type ${req.user.userType} not authorized to access this route`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize }; 