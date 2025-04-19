const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  getCourses, 
  getCourse, 
  createCourse, 
  updateCourse, 
  deleteCourse, 
  getTutorCourses 
} = require('../controllers/course.controller');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images Only!'));
    }
  },
});

// All routes
router.get('/', getCourses);
router.get('/:id', getCourse);
router.get('/tutor/:tutorId', getTutorCourses);
router.post('/', upload.single('thumbnail'), createCourse);
router.put('/:id', upload.single('thumbnail'), updateCourse);
router.delete('/:id', deleteCourse);

module.exports = router; 