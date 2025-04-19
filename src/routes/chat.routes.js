const express = require('express');
const router = express.Router();
const {
  getChatRoom,
  sendMessage,
  getMessages,
} = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.get('/room/:courseId', protect, getChatRoom);
router.post('/message', protect, sendMessage);
router.get('/messages/:roomId', protect, getMessages);

module.exports = router; 