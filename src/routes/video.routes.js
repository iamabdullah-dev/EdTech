const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  uploadVideo,
  getCourseVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  updateProgress,
} = require('../controllers/video.controller');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
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
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /mp4|mov|avi|wmv|mkv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Videos Only!'));
    }
  },
});

// All routes
router.get('/course/:courseId', getCourseVideos);
router.post('/', upload.single('video'), uploadVideo);
router.get('/:id', getVideo);
router.put('/:id', updateVideo);
router.delete('/:id', deleteVideo);
router.put('/:id/progress', updateProgress);

module.exports = router; 