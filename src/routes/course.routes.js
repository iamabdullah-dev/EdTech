const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  getCourses, 
  getCourse, 
  createCourse, 
  updateCourse, 
  deleteCourse, 
  getTutorCourses 
} = require('../controllers/course.controller');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
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

// Log details about the file upload
const logFileUpload = (req, res, next) => {
  if (req.file) {
    console.log('File uploaded:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });
  } else if (req.method === 'POST' || req.method === 'PUT') {
    console.log('No file detected in the request');
  }
  next();
};

// All routes
router.get('/', getCourses);
router.get('/tutor/:tutorId', getTutorCourses);
router.get('/:id', getCourse);
router.post('/', upload.single('thumbnail'), logFileUpload, createCourse);
router.put('/:id', upload.single('thumbnail'), logFileUpload, updateCourse);
router.delete('/:id', deleteCourse);

module.exports = router; 