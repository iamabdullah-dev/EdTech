const db = require('../config/db');

// @desc    Enroll in a course
// @route   POST /api/enrollments
// @access  Public
const enrollInCourse = async (req, res) => {
  const { courseId, studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: 'Student ID is required',
    });
  }

  try {
    // Check if user exists and is a student
    const userCheck = await db.query(
      'SELECT * FROM users WHERE id = $1 AND user_type = $2',
      [studentId, 'student']
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if course exists
    const courseResult = await db.query(
      'SELECT * FROM courses WHERE id = $1 AND is_published = true',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not available for enrollment',
      });
    }

    // Check if already enrolled
    const enrollmentCheck = await db.query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course',
      });
    }

    // Create enrollment
    const enrollmentResult = await db.query(
      'INSERT INTO enrollments (student_id, course_id, status, progress_percentage) VALUES ($1, $2, $3, $4) RETURNING *',
      [studentId, courseId, 'active', 0]
    );

    // Initialize course progress
    const videoCountResult = await db.query(
      'SELECT COUNT(*) FROM videos WHERE course_id = $1',
      [courseId]
    );

    const totalVideos = parseInt(videoCountResult.rows[0].count);

    await db.query(
      'INSERT INTO course_progress (enrollment_id, videos_completed, total_videos) VALUES ($1, $2, $3)',
      [enrollmentResult.rows[0].id, 0, totalVideos]
    );

    res.status(201).json({
      success: true,
      enrollment: enrollmentResult.rows[0],
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

// @desc    Get all courses a student is enrolled in
// @route   GET /api/enrollments/student/:studentId
// @access  Public
const getStudentEnrollments = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Verify the student exists
    const studentCheck = await db.query(
      'SELECT * FROM users WHERE id = $1 AND user_type = $2',
      [studentId, 'student']
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const result = await db.query(`
      SELECT e.*, c.title, c.description, c.thumbnail_url, u.full_name as tutor_name,
        cp.videos_completed, cp.total_videos
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.tutor_id = u.id
      LEFT JOIN course_progress cp ON e.id = cp.enrollment_id
      WHERE e.student_id = $1
      ORDER BY e.created_at DESC
    `, [studentId]);

    res.json({
      success: true,
      count: result.rows.length,
      enrollments: result.rows,
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

// @desc    Get a single enrollment with course details
// @route   GET /api/enrollments/:id
// @access  Public
const getEnrollment = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, c.title, c.description, c.thumbnail_url, u.full_name as tutor_name,
        cp.videos_completed, cp.total_videos, cp.completion_date
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.tutor_id = u.id
      LEFT JOIN course_progress cp ON e.id = cp.enrollment_id
      WHERE e.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Get course videos with progress
    const videos = await db.query(`
      SELECT v.id, v.title, v.description, v.sequence_order, v.duration,
        COALESCE(vp.last_watched_position, 0) as last_position,
        COALESCE(vp.is_completed, false) as is_completed
      FROM videos v
      LEFT JOIN video_progress vp ON v.id = vp.video_id AND vp.enrollment_id = $1
      WHERE v.course_id = $2
      ORDER BY v.sequence_order
    `, [req.params.id, result.rows[0].course_id]);

    res.json({
      success: true,
      enrollment: {
        ...result.rows[0],
        videos: videos.rows,
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

// @desc    Get all enrollments for a course
// @route   GET /api/enrollments/course/:courseId
// @access  Public
const getCourseEnrollments = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, u.full_name as student_name, u.email as student_email,
        cp.videos_completed, cp.total_videos, cp.completion_date
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN course_progress cp ON e.id = cp.enrollment_id
      WHERE e.course_id = $1
      ORDER BY e.created_at DESC
    `, [req.params.courseId]);

    res.json({
      success: true,
      count: result.rows.length,
      enrollments: result.rows,
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

// @desc    Check if a student is enrolled in a course
// @route   POST /api/enrollments/check
// @access  Public
const checkEnrollmentStatus = async (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({
      success: false,
      message: 'Student ID and Course ID are required',
    });
  }

  try {
    const result = await db.query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );

    res.json({
      success: true,
      isEnrolled: result.rows.length > 0,
      enrollment: result.rows[0] || null
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

// @desc    Update video progress for an enrollment
// @route   POST /api/enrollments/:id/progress
// @access  Public
const updateVideoProgress = async (req, res) => {
  const { id } = req.params;
  const { videoId, isCompleted, lastPosition } = req.body;

  if (!videoId) {
    return res.status(400).json({
      success: false,
      message: 'Video ID is required',
    });
  }

  try {
    // Check if enrollment exists
    const enrollmentCheck = await db.query(
      'SELECT * FROM enrollments WHERE id = $1',
      [id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Check if video exists and belongs to the course
    const videoCheck = await db.query(
      'SELECT v.* FROM videos v JOIN courses c ON v.course_id = c.id JOIN enrollments e ON c.id = e.course_id WHERE v.id = $1 AND e.id = $2',
      [videoId, id]
    );

    if (videoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or not part of this course',
      });
    }

    // Check if progress entry exists
    const progressCheck = await db.query(
      'SELECT * FROM video_progress WHERE enrollment_id = $1 AND video_id = $2',
      [id, videoId]
    );

    let result;

    if (progressCheck.rows.length === 0) {
      // Create new progress entry
      result = await db.query(
        `INSERT INTO video_progress (enrollment_id, video_id, is_completed, last_watched_position) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [id, videoId, isCompleted || false, lastPosition || 0]
      );
    } else {
      // Update existing progress entry
      const updateData = [];
      const updateValues = [id, videoId];
      let updateIndex = 3;
      let updateQuery = 'UPDATE video_progress SET ';

      if (isCompleted !== undefined) {
        updateData.push(`is_completed = $${updateIndex}`);
        updateValues.push(isCompleted);
        updateIndex++;
      }

      if (lastPosition !== undefined) {
        updateData.push(`last_watched_position = $${updateIndex}`);
        updateValues.push(lastPosition);
        updateIndex++;
      }

      updateQuery += updateData.join(', ');
      updateQuery += ' WHERE enrollment_id = $1 AND video_id = $2 RETURNING *';

      result = await db.query(updateQuery, updateValues);
    }

    // Update course progress if video was marked as completed
    if (isCompleted) {
      // Count total completed videos
      const completedCount = await db.query(
        'SELECT COUNT(*) FROM video_progress WHERE enrollment_id = $1 AND is_completed = true',
        [id]
      );
      
      // Count total videos in the course
      const totalCount = await db.query(
        `SELECT COUNT(*) FROM videos v 
         JOIN courses c ON v.course_id = c.id 
         JOIN enrollments e ON c.id = e.course_id 
         WHERE e.id = $1`,
        [id]
      );
      
      const videosCompleted = parseInt(completedCount.rows[0].count);
      const totalVideos = parseInt(totalCount.rows[0].count);
      
      // Update the course_progress table
      await db.query(
        `UPDATE course_progress SET 
         videos_completed = $1, 
         total_videos = $2,
         progress_percentage = $3,
         completion_date = CASE WHEN $1 = $2 THEN CURRENT_TIMESTAMP ELSE completion_date END
         WHERE enrollment_id = $4`,
        [videosCompleted, totalVideos, Math.round((videosCompleted / totalVideos) * 100), id]
      );
    }

    res.json({
      success: true,
      progress: result.rows[0],
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
  enrollInCourse,
  getStudentEnrollments,
  getEnrollment,
  getCourseEnrollments,
  checkEnrollmentStatus,
  updateVideoProgress
}; 