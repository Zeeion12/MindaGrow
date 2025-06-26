// server/routes/courses.js
const express = require('express');
const router = express.Router();
const courseController = require('../controller/courseController');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Akses ditolak' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

// Optional auth middleware - tidak require token tapi add user jika available
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

// Public routes - bisa diakses tanpa login
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/popular', courseController.getPopularCourses);
router.get('/new', courseController.getNewCourses);
router.get('/categories', courseController.getCategories);
router.get('/:id', optionalAuth, courseController.getCourseById);

// Protected routes - require authentication
router.use(authenticateToken);

// Student routes
router.post('/:id/enroll', courseController.enrollCourse);
router.delete('/:id/unenroll', courseController.unenrollCourse);
router.get('/my/enrolled', courseController.getMyEnrolledCourses);

// Teacher/Admin routes  
router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);
router.get('/my/created', courseController.getMyCreatedCourses);

module.exports = router;