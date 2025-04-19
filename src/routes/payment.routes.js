const express = require('express');
const router = express.Router();
const {
  processPayment,
  getPaymentHistory,
  getTutorEarnings,
} = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Process payment route (students only)
router.post('/process', protect, authorize('student'), processPayment);

// Get payment history (students only)
router.get('/history', protect, authorize('student'), getPaymentHistory);

// Get tutor earnings (tutors only)
router.get('/earnings', protect, authorize('tutor'), getTutorEarnings);

module.exports = router; 