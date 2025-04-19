const express = require('express');
const router = express.Router();
const {
  enrollInCourse,
  getStudentEnrollments,
  getEnrollment,
  getCourseEnrollments,
  checkEnrollmentStatus,
  updateVideoProgress
} = require('../controllers/enrollment.controller');

// All routes
router.post('/', enrollInCourse);
router.post('/check', checkEnrollmentStatus);
router.get('/student/:studentId', getStudentEnrollments);
router.get('/:id', getEnrollment);
router.get('/course/:courseId', getCourseEnrollments);
router.post('/:id/progress', updateVideoProgress);

module.exports = router;