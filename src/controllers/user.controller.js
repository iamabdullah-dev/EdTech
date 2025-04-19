const db = require('../config/db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Public
const updateProfile = async (req, res) => {
  const { userId, fullName, email, bio, profilePicture, userType } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
    });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [userId];
    let paramCount = 2;

    if (fullName) {
      updates.push(`full_name = $${paramCount}`);
      values.push(fullName);
      paramCount++;
    }

    if (email) {
      // Check if email is already taken by another user
      const emailCheck = await db.query(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }

      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }

    if (profilePicture) {
      updates.push(`profile_picture = $${paramCount}`);
      values.push(profilePicture);
      paramCount++;
    }

    if (userType) {
      updates.push(`user_type = $${paramCount}`);
      values.push(userType);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update fields provided',
      });
    }

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING id, full_name, email, bio, profile_picture, user_type, created_at, updated_at
    `;

    const result = await db.query(updateQuery, values);

    res.json({
      success: true,
      user: result.rows[0],
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

// @desc    Change user password
// @route   PUT /api/users/password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Get user with password
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = userResult.rows[0];

    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully',
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

// @desc    Get tutor profile
// @route   GET /api/users/tutor/:id
// @access  Public
const getTutorProfile = async (req, res) => {
  try {
    const tutorId = req.params.id;

    // Check if tutor exists and is a tutor
    const tutorCheck = await db.query(
      "SELECT * FROM users WHERE id = $1 AND user_type = 'tutor'",
      [tutorId]
    );

    if (tutorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found',
      });
    }

    // Get tutor profile with course count and student count
    const tutorProfile = await db.query(
      `SELECT 
        u.id, u.full_name, u.email, u.bio, u.profile_picture, u.created_at,
        (SELECT COUNT(*) FROM courses WHERE tutor_id = u.id) AS course_count,
        (SELECT COUNT(DISTINCT student_id) FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         WHERE c.tutor_id = u.id) AS student_count,
        (SELECT COALESCE(AVG(rating), 0) FROM course_reviews cr 
         JOIN courses c ON cr.course_id = c.id 
         WHERE c.tutor_id = u.id) AS average_rating
      FROM users u
      WHERE u.id = $1`,
      [tutorId]
    );

    // Get tutor's courses
    const tutorCourses = await db.query(
      `SELECT 
        c.id, c.title, c.description, c.thumbnail, c.price, c.created_at,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS student_count,
        (SELECT COALESCE(AVG(rating), 0) FROM course_reviews WHERE course_id = c.id) AS average_rating
      FROM courses c
      WHERE c.tutor_id = $1
      ORDER BY c.created_at DESC`,
      [tutorId]
    );

    res.json({
      success: true,
      tutor: {
        ...tutorProfile.rows[0],
        courses: tutorCourses.rows,
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
  updateProfile,
  changePassword,
  getTutorProfile,
}; 