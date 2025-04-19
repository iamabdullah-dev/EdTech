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

const videoFilter = function (req, file, cb) {
  const filetypes = /mp4|mov|avi|wmv|mkv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/');

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Videos Only!'));
  }
};

// Configure multer with storage and file filter
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: videoFilter,
});

// Conditional upload middleware that only applies when uploading files
const conditionalUpload = (req, res, next) => {
  // If the request indicates it's an external video (not a file upload)
  if (req.body.type === 'external') {
    return next();
  }
  
  // Otherwise, apply the multer middleware for file uploads
  return upload.single('video')(req, res, next);
};

// All routes
router.get('/course/:courseId', getCourseVideos);
router.get('/:id', getVideo);
router.post('/', conditionalUpload, uploadVideo);
router.put('/:id', conditionalUpload, updateVideo);
router.delete('/:id', deleteVideo);
router.put('/:id/progress', updateProgress);

module.exports = router; 