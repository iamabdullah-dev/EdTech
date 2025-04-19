const express = require('express');
const router = express.Router();
const {
  enrollInCourse,
  getStudentEnrollments,
  getEnrollment,
  getCourseEnrollments,
} = require('../controllers/enrollment.controller');

// All routes
router.post('/', enrollInCourse);
router.get('/student/:studentId', getStudentEnrollments);
router.get('/:id', getEnrollment);
router.get('/course/:courseId', getCourseEnrollments);

module.exports = router;