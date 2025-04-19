const db = require('../config/db');
// Initialize Stripe only if API key is available
let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (error) {
  console.error('Stripe initialization failed:', error.message);
  stripe = {
    paymentIntents: {
      create: async () => {
        throw new Error('Stripe API key not configured');
      },
    },
  };
}

// @desc    Process payment for course enrollment
// @route   POST /api/payments/process
// @access  Public
const processPayment = async (req, res) => {
  const { courseId, userId, paymentMethodId } = req.body;

  if (!courseId || !userId || !paymentMethodId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID, User ID, and payment method ID are required',
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

    // Check if user is already enrolled
    const enrollmentCheck = await db.query(
      'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [courseId, userId]
    );
    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already enrolled in this course',
      });
    }

    const course = courseCheck.rows[0];
    const user = userCheck.rows[0];

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(course.price * 100), // Stripe requires amount in cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      description: `Enrollment for ${course.title}`,
      metadata: {
        courseId: course.id,
        userId: user.id,
      },
    });

    if (paymentIntent.status === 'succeeded') {
      // Create payment record
      const paymentResult = await db.query(
        `INSERT INTO payments (student_id, course_id, amount, payment_intent_id, payment_method_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, student_id, course_id, amount, status, created_at`,
        [
          userId,
          courseId,
          course.price,
          paymentIntent.id,
          paymentMethodId,
          'completed',
        ]
      );

      // Create enrollment
      const enrollmentResult = await db.query(
        `INSERT INTO enrollments (student_id, course_id, payment_id)
         VALUES ($1, $2, $3)
         RETURNING id, student_id, course_id, created_at`,
        [userId, courseId, paymentResult.rows[0].id]
      );

      res.json({
        success: true,
        payment: paymentResult.rows[0],
        enrollment: enrollmentResult.rows[0],
        message: 'Payment processed successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        status: paymentIntent.status,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message,
    });
  }
};

// @desc    Get payment history for a student
// @route   GET /api/payments/history
// @access  Public
const getPaymentHistory = async (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: 'Student ID is required',
    });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [studentId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get payment history with course details
    const payments = await db.query(
      `SELECT 
        p.id, p.amount, p.status, p.created_at, 
        c.id as course_id, c.title as course_title, c.thumbnail as course_thumbnail,
        u.id as tutor_id, u.full_name as tutor_name
      FROM payments p
      JOIN courses c ON p.course_id = c.id
      JOIN users u ON c.tutor_id = u.id
      WHERE p.student_id = $1
      ORDER BY p.created_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      payments: payments.rows,
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

// @desc    Get earnings for a tutor
// @route   GET /api/payments/earnings
// @access  Public
const getTutorEarnings = async (req, res) => {
  const { tutorId } = req.query;

  if (!tutorId) {
    return res.status(400).json({
      success: false,
      message: 'Tutor ID is required',
    });
  }

  try {
    // Check if user exists and is a tutor
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

    // Get total earnings
    const totalEarnings = await db.query(
      `SELECT SUM(p.amount) as total
       FROM payments p
       JOIN courses c ON p.course_id = c.id
       WHERE c.tutor_id = $1 AND p.status = 'completed'`,
      [tutorId]
    );

    // Get earnings by course
    const courseEarnings = await db.query(
      `SELECT 
        c.id, c.title,
        COUNT(p.id) as total_sales,
        SUM(p.amount) as total_amount
       FROM payments p
       JOIN courses c ON p.course_id = c.id
       WHERE c.tutor_id = $1 AND p.status = 'completed'
       GROUP BY c.id, c.title
       ORDER BY total_amount DESC`,
      [tutorId]
    );

    // Get recent transactions
    const recentTransactions = await db.query(
      `SELECT 
        p.id, p.amount, p.created_at, p.status,
        c.id as course_id, c.title as course_title,
        u.id as student_id, u.full_name as student_name
       FROM payments p
       JOIN courses c ON p.course_id = c.id
       JOIN users u ON p.student_id = u.id
       WHERE c.tutor_id = $1 AND p.status = 'completed'
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [tutorId]
    );

    res.json({
      success: true,
      totalEarnings: totalEarnings.rows[0]?.total || 0,
      courseEarnings: courseEarnings.rows,
      recentTransactions: recentTransactions.rows,
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
  processPayment,
  getPaymentHistory,
  getTutorEarnings,
}; 