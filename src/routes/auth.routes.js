const express = require('express');
const router = express.Router();
const { register, login, getUserById } = require('../controllers/auth.controller');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Get user by ID
router.get('/user/:id', getUserById);

module.exports = router; 