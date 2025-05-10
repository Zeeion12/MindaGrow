const express = require('express');
const router = express.Router();
const courseController = require('../controller/courseController');
const lessonController = require('../controller/lessonController');
const teacherController = require('../controller/teacherController');
const userController = require('../controller/userController');
const { authenticateToken } = require('../middleware/auth');

// Course routes
router.get('/courses', courseController.getAllCourses);
router.get('/courses/popular', courseController.getPopularCourses);
router.get('/courses/new', courseController.getNewCourses);
router.get('/courses/:id', courseController.getCourse);
router.get('/courses/:id/learn', authenticateToken, courseController.getCourseForLearning);
router.post('/courses/:id/enroll', authenticateToken, courseController.enrollCourse);
router.get('/courses/:id/progress', authenticateToken, courseController.getCourseProgress);
router.get('/courses/:id/enrollment', authenticateToken, courseController.checkEnrollment);

// Category routes
router.get('/categories', courseController.getAllCategories);

// Lesson routes
router.get('/lessons/:id', authenticateToken, lessonController.getLesson);
router.post('/lessons/:id/progress', authenticateToken, lessonController.updateLessonProgress);

// Teacher routes
router.get('/teachers/:id', teacherController.getTeacherProfile);

// User routes
router.get('/users/me/progress', authenticateToken, courseController.getUserProgress);
router.get('/users/me/streak', authenticateToken, userController.getUserStreak);

module.exports = router;