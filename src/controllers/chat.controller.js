const db = require('../config/db');

// @desc    Get or create a chat room for a course
// @route   GET /api/chat/room/:courseId
// @access  Public
const getChatRoom = async (req, res) => {
  const { courseId } = req.params;
  const { userId } = req.query;

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

    // Check if course exists
    const courseCheck = await db.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // If user is student, check if enrolled
    if (userCheck.rows[0].user_type === 'student') {
      const enrollmentCheck = await db.query(
        'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
        [courseId, userId]
      );
      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Student must be enrolled in the course to access chat',
        });
      }
    }

    // Check if tutor is the course owner
    if (userCheck.rows[0].user_type === 'tutor') {
      const tutorCheck = await db.query(
        'SELECT * FROM courses WHERE id = $1 AND tutor_id = $2',
        [courseId, userId]
      );
      if (tutorCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Only the course tutor can access this chat',
        });
      }
    }

    // Check if chat room exists for the course
    const roomCheck = await db.query('SELECT * FROM chat_rooms WHERE course_id = $1', [courseId]);

    let room;
    if (roomCheck.rows.length === 0) {
      // Create a new chat room
      const result = await db.query(
        'INSERT INTO chat_rooms (course_id, name) VALUES ($1, $2) RETURNING *',
        [courseId, `Chat for course ${courseId}`]
      );
      room = result.rows[0];
    } else {
      room = roomCheck.rows[0];
    }

    res.json({
      success: true,
      room,
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

// @desc    Send a message in a chat room
// @route   POST /api/chat/message
// @access  Public
const sendMessage = async (req, res) => {
  const { roomId, userId, content } = req.body;

  if (!roomId || !userId || !content) {
    return res.status(400).json({
      success: false,
      message: 'Room ID, User ID, and message content are required',
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

    // Check if chat room exists
    const roomCheck = await db.query('SELECT * FROM chat_rooms WHERE id = $1', [roomId]);
    if (roomCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    const courseId = roomCheck.rows[0].course_id;

    // If user is student, check if enrolled
    if (userCheck.rows[0].user_type === 'student') {
      const enrollmentCheck = await db.query(
        'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
        [courseId, userId]
      );
      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Student must be enrolled in the course to send messages',
        });
      }
    }

    // Check if tutor is the course owner
    if (userCheck.rows[0].user_type === 'tutor') {
      const tutorCheck = await db.query(
        'SELECT * FROM courses WHERE id = $1 AND tutor_id = $2',
        [courseId, userId]
      );
      if (tutorCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Only the course tutor can send messages in this chat',
        });
      }
    }

    // Create a new message
    const result = await db.query(
      `INSERT INTO chat_messages (room_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, room_id, user_id, content, created_at`,
      [roomId, userId, content]
    );

    // Get user info
    const userInfo = await db.query(
      'SELECT id, full_name, profile_picture, user_type FROM users WHERE id = $1',
      [userId]
    );

    const message = {
      ...result.rows[0],
      user: userInfo.rows[0],
    };

    res.json({
      success: true,
      message,
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

// @desc    Get messages from a chat room
// @route   GET /api/chat/messages/:roomId
// @access  Public
const getMessages = async (req, res) => {
  const { roomId } = req.params;
  const { userId, limit = 50, page = 1 } = req.query;

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

    // Check if chat room exists
    const roomCheck = await db.query('SELECT * FROM chat_rooms WHERE id = $1', [roomId]);
    if (roomCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    const courseId = roomCheck.rows[0].course_id;

    // If user is student, check if enrolled
    if (userCheck.rows[0].user_type === 'student') {
      const enrollmentCheck = await db.query(
        'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
        [courseId, userId]
      );
      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Student must be enrolled in the course to view messages',
        });
      }
    }

    // Check if tutor is the course owner
    if (userCheck.rows[0].user_type === 'tutor') {
      const tutorCheck = await db.query(
        'SELECT * FROM courses WHERE id = $1 AND tutor_id = $2',
        [courseId, userId]
      );
      if (tutorCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Only the course tutor can view messages in this chat',
        });
      }
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get messages with user info
    const messagesResult = await db.query(
      `SELECT m.id, m.room_id, m.user_id, m.content, m.created_at,
              u.full_name, u.profile_picture, u.user_type
       FROM chat_messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.room_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [roomId, limit, offset]
    );

    // Format messages
    const messages = messagesResult.rows.map(row => ({
      id: row.id,
      roomId: row.room_id,
      content: row.content,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        fullName: row.full_name,
        profilePicture: row.profile_picture,
        userType: row.user_type,
      },
    }));

    // Get total count for pagination
    const countResult = await db.query(
      'SELECT COUNT(*) FROM chat_messages WHERE room_id = $1',
      [roomId]
    );

    const totalMessages = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalMessages / limit);

    res.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages,
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
  getChatRoom,
  sendMessage,
  getMessages,
}; 