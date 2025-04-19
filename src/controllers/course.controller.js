const db = require('../config/db');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    console.log('GET /api/courses endpoint called');

    // Try a simpler query first without joins to isolate the issue
    const simpleCourseQuery = await db.query(`SELECT * FROM courses`);
    console.log(`Simple query found ${simpleCourseQuery.rows.length} courses`);

    // Get basic course information - temporarily removing the is_published filter for debugging
    let coursesResult;
    try {
      coursesResult = await db.query(`
        SELECT c.*, u.full_name as tutor_name 
        FROM courses c
        JOIN users u ON c.tutor_id = u.id
        ORDER BY c.created_at DESC
      `);
      console.log(`JOIN query found ${coursesResult.rows.length} courses`);
    } catch (joinError) {
      console.error('Error with JOIN query:', joinError);
      // Fallback to simple query without JOIN if the JOIN fails
      coursesResult = { rows: simpleCourseQuery.rows };
      console.log('Using simple query results as fallback');
    }

    // If no courses were found, return an empty array instead of doing more processing
    if (coursesResult.rows.length === 0) {
      return res.json({
        success: true,
        count: 0,
        courses: [],
        message: 'No courses found in database'
      });
    }

    const courses = await Promise.all(coursesResult.rows.map(async (course) => {
      // Get enrollment count for each course
      const enrollmentCountResult = await db.query(
        'SELECT COUNT(*) FROM enrollments WHERE course_id = $1',
        [course.id]
      );
      
      // Calculate total course duration
      const totalDurationResult = await db.query(
        'SELECT SUM(duration) as total_duration FROM videos WHERE course_id = $1',
        [course.id]
      );
      
      const totalDuration = parseInt(totalDurationResult.rows[0]?.total_duration || 0);
      const totalHours = Math.floor(totalDuration / 3600);
      const totalMinutes = Math.floor((totalDuration % 3600) / 60);
      
      return {
        ...course,
        students_enrolled: parseInt(enrollmentCountResult.rows[0].count),
        totalHours: totalHours,
        totalMinutes: totalMinutes,
        formattedDuration: `${totalHours}h ${totalMinutes}m`
      };
    }));

    console.log(`Processed ${courses.length} courses with details`);

    res.json({
      success: true,
      count: courses.length,
      courses: courses,
    });
  } catch (error) {
    console.error('Error in getCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourse = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, u.full_name as tutor_name, u.bio as tutor_bio, u.profile_picture as tutor_profile_picture
      FROM courses c
      JOIN users u ON c.tutor_id = u.id
      WHERE c.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Get videos for the course
    const videos = await db.query(`
      SELECT id, title, description, duration, sequence_order
      FROM videos
      WHERE course_id = $1
      ORDER BY sequence_order
    `, [req.params.id]);

    // Get enrollment count
    const enrollmentCount = await db.query(`
      SELECT COUNT(*) 
      FROM enrollments 
      WHERE course_id = $1
    `, [req.params.id]);

    // Calculate total hours
    const totalDurationResult = await db.query(`
      SELECT SUM(duration) as total_duration
      FROM videos
      WHERE course_id = $1
    `, [req.params.id]);

    const totalDuration = parseInt(totalDurationResult.rows[0]?.total_duration || 0);
    const totalHours = Math.floor(totalDuration / 3600);
    const totalMinutes = Math.floor((totalDuration % 3600) / 60);

    const course = result.rows[0];
    
    res.json({
      success: true,
      course: {
        ...course,
        videos: videos.rows,
        students_enrolled: parseInt(enrollmentCount.rows[0].count),
        totalHours: totalHours,
        totalMinutes: totalMinutes,
        formattedDuration: `${totalHours}h ${totalMinutes}m`
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

// @desc    Create new course
// @route   POST /api/courses
// @access  Public
const createCourse = async (req, res) => {
  const { title, description, price, tutorId } = req.body;
  let thumbnailUrl = null;

  if (!tutorId) {
    return res.status(400).json({
      success: false,
      message: 'Tutor ID is required',
    });
  }

  // Check if file was uploaded
  if (req.file) {
    thumbnailUrl = `/uploads/${req.file.filename}`;
    console.log('Thumbnail uploaded, path:', thumbnailUrl);
  } else {
    console.log('No thumbnail file uploaded');
  }

  try {
    // Verify the tutor exists
    const tutorCheck = await db.query(
      'SELECT * FROM users WHERE id = $1 AND user_type = $2',
      [tutorId, 'tutor']
    );

    if (tutorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found',
      });
    }

    const result = await db.query(
      `INSERT INTO courses 
      (tutor_id, title, description, thumbnail_url, price, is_published) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [tutorId, title, description, thumbnailUrl, price, false]
    );

    // Create a chat room for the course
    await db.query(
      `INSERT INTO chat_rooms (course_id, name) VALUES ($1, $2)`,
      [result.rows[0].id, `${title} Discussion`]
    );

    console.log('Course created with thumbnail_url:', result.rows[0].thumbnail_url);

    res.status(201).json({
      success: true,
      course: result.rows[0],
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

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Public
const updateCourse = async (req, res) => {
  const { title, description, price, isPublished, tutorId } = req.body;
  let thumbnailUrl = req.body.thumbnailUrl;

  if (!tutorId) {
    return res.status(400).json({
      success: false,
      message: 'Tutor ID is required',
    });
  }

  try {
    // Check if course exists and belongs to the tutor
    const courseCheck = await db.query(
      `SELECT * FROM courses WHERE id = $1 AND tutor_id = $2`,
      [req.params.id, tutorId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you are not authorized',
      });
    }

    // Check if file was uploaded
    if (req.file) {
      thumbnailUrl = `/uploads/${req.file.filename}`;
    }

    // Build update query dynamically based on what was provided
    let updateFields = [];
    let queryParams = [];
    let paramCount = 1;

    if (title) {
      updateFields.push(`title = $${paramCount++}`);
      queryParams.push(title);
    }

    if (description) {
      updateFields.push(`description = $${paramCount++}`);
      queryParams.push(description);
    }

    if (thumbnailUrl) {
      updateFields.push(`thumbnail_url = $${paramCount++}`);
      queryParams.push(thumbnailUrl);
    }

    if (price) {
      updateFields.push(`price = $${paramCount++}`);
      queryParams.push(price);
    }

    if (isPublished !== undefined) {
      updateFields.push(`is_published = $${paramCount++}`);
      queryParams.push(isPublished);
    }

    // Always add updated_at
    updateFields.push(`updated_at = NOW()`);

    // Add course ID and tutor ID to the query params
    queryParams.push(req.params.id);
    queryParams.push(tutorId);

    const result = await db.query(
      `UPDATE courses 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount++} AND tutor_id = $${paramCount} 
       RETURNING *`,
      queryParams
    );

    res.json({
      success: true,
      course: result.rows[0],
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

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Public
const deleteCourse = async (req, res) => {
  const { tutorId } = req.body;

  if (!tutorId) {
    return res.status(400).json({
      success: false,
      message: 'Tutor ID is required',
    });
  }

  try {
    // Check if course exists and belongs to the tutor
    const courseCheck = await db.query(
      `SELECT * FROM courses WHERE id = $1 AND tutor_id = $2`,
      [req.params.id, tutorId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you are not authorized',
      });
    }

    // Delete the course (cascade will handle related records)
    await db.query(`DELETE FROM courses WHERE id = $1`, [req.params.id]);

    res.json({
      success: true,
      message: 'Course deleted successfully',
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

// @desc    Get tutor courses
// @route   GET /api/courses/tutor/:tutorId
// @access  Public
const getTutorCourses = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, 
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count,
      (SELECT COUNT(*) FROM videos WHERE course_id = c.id) as video_count
      FROM courses c
      WHERE c.tutor_id = $1
      ORDER BY c.created_at DESC`,
      [req.params.tutorId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      courses: result.rows,
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
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getTutorCourses,
}; 