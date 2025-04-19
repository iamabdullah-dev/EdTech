const bcrypt = require('bcryptjs');
const db = require('../config/db');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { email, password, fullName, userType } = req.body;

  try {
    // Check if user exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await db.query(
      'INSERT INTO users (email, password_hash, full_name, user_type) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, user_type',
      [email, hashedPassword, fullName, userType]
    );

    const user = result.rows[0];

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          userType: user.user_type,
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const result = await db.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    const user = result.rows[0];

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          userType: user.user_type,
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/auth/user/:id
// @access  Public
const getUserById = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, user_type, profile_picture, bio FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
        profilePicture: user.profile_picture,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getUserById,
}; 