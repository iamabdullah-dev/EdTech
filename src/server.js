const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const multer = require('multer');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const videoRoutes = require('./routes/video.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const chatRoutes = require('./routes/chat.routes');
const paymentRoutes = require('./routes/payment.routes');

// Import necessary controllers
const { getCourseVideos, uploadVideo, updateVideo, deleteVideo } = require('./controllers/video.controller');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to log static file requests
const logStaticRequests = (req, res, next) => {
  console.log('Static file requested:', req.url);
  next();
};

// Static folder for uploads - add logging middleware
app.use('/uploads', logStaticRequests, express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
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

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: videoFilter,
});

// Conditional upload middleware that only applies when uploading files
const conditionalUpload = (req, res, next) => {
  // For multipart form data, we need to check the 'type' field after the form is parsed
  // We can't directly check req.body.type here because multer hasn't parsed the form yet
  if (req.get('Content-Type')?.includes('application/json')) {
    // For JSON requests, assume it's an external video
    return next();
  }
  
  // Use multer to handle the file upload
  upload.single('video')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file',
      });
    }
    next();
  });
};

// Direct route handlers for course videos
app.get('/api/courses/:courseId/videos', (req, res) => {
  // Forward the courseId from params to the controller
  req.params.courseId = req.params.courseId;
  getCourseVideos(req, res);
});

app.post('/api/courses/:courseId/videos', conditionalUpload, (req, res) => {
  // Add courseId from params to the body
  req.body.courseId = req.params.courseId;
  uploadVideo(req, res);
});

app.put('/api/courses/:courseId/videos/:id', conditionalUpload, (req, res) => {
  // Add courseId from params to the body
  req.body.courseId = req.params.courseId;
  req.params.id = req.params.id;
  updateVideo(req, res);
});

app.delete('/api/courses/:courseId/videos/:id', (req, res) => {
  // Add courseId from params to the body
  req.body.courseId = req.params.courseId;
  req.params.id = req.params.id;
  deleteVideo(req, res);
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Professor Chad\'s EdTech API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Not found middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 