const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Check authentication status route (protected)
router.get('/check-status', authMiddleware, authController.checkStatus);

// Make sure to export the router
module.exports = router;