// server/controller/courseController.js
const courseService = require('../services/coursesService');

const courseController = {
  // Get all courses with pagination and filtering
  getAllCourses: async (req, res) => {
    try {
      const { page = 1, limit = 10, category, search, level } = req.query;
      const filters = { category, search, level };
      
      const result = await courseService.getAllCourses(page, limit, filters);
      
      res.json({
        success: true,
        data: result.courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.total / limit),
          totalItems: result.total,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get all courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching courses',
        error: error.message
      });
    }
  },

  // Get course by ID with details
  getCourseById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const course = await courseService.getCourseById(id, userId);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      res.json({
        success: true,
        data: course
      });
    } catch (error) {
      console.error('Get course by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching course',
        error: error.message
      });
    }
  },

  // Get popular courses
  getPopularCourses: async (req, res) => {
    try {
      const { limit = 6 } = req.query;
      const courses = await courseService.getPopularCourses(limit);
      
      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Get popular courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching popular courses',
        error: error.message
      });
    }
  },

  // Get new courses
  getNewCourses: async (req, res) => {
    try {
      const { limit = 6 } = req.query;
      const courses = await courseService.getNewCourses(limit);
      
      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Get new courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching new courses',
        error: error.message
      });
    }
  },

  // Get categories
  getCategories: async (req, res) => {
    try {
      const categories = await courseService.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching categories',
        error: error.message
      });
    }
  },

  // Create new course (guru/admin only)
  createCourse: async (req, res) => {
    try {
      const { role } = req.user;
      
      if (!['guru', 'admin'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Only teachers and admins can create courses'
        });
      }

      const courseData = {
        ...req.body,
        instructor_id: req.user.id,
        created_by: req.user.id
      };

      const course = await courseService.createCourse(courseData);
      
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating course',
        error: error.message
      });
    }
  },

  // Update course (guru/admin only)
  updateCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;
      
      // Check if user can update this course
      const course = await courseService.getCourseById(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      if (role !== 'admin' && course.instructor_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own courses'
        });
      }

      const updatedCourse = await courseService.updateCourse(id, req.body);
      
      res.json({
        success: true,
        message: 'Course updated successfully',
        data: updatedCourse
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating course',
        error: error.message
      });
    }
  },

  // Delete course (admin only)
  deleteCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.user;
      
      if (role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete courses'
        });
      }

      await courseService.deleteCourse(id);
      
      res.json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting course',
        error: error.message
      });
    }
  },

  // Enroll in course (siswa only)
  enrollCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      
      if (role !== 'siswa') {
        return res.status(403).json({
          success: false,
          message: 'Only students can enroll in courses'
        });
      }

      const enrollment = await courseService.enrollCourse(userId, id);
      
      res.status(201).json({
        success: true,
        message: 'Successfully enrolled in course',
        data: enrollment
      });
    } catch (error) {
      if (error.message === 'Already enrolled') {
        return res.status(400).json({
          success: false,
          message: 'You are already enrolled in this course'
        });
      }
      
      console.error('Enroll course error:', error);
      res.status(500).json({
        success: false,
        message: 'Error enrolling in course',
        error: error.message
      });
    }
  },

  // Unenroll from course (siswa only)
  unenrollCourse: async (req, res) => {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      
      if (role !== 'siswa') {
        return res.status(403).json({
          success: false,
          message: 'Only students can unenroll from courses'
        });
      }

      await courseService.unenrollCourse(userId, id);
      
      res.json({
        success: true,
        message: 'Successfully unenrolled from course'
      });
    } catch (error) {
      console.error('Unenroll course error:', error);
      res.status(500).json({
        success: false,
        message: 'Error unenrolling from course',
        error: error.message
      });
    }
  },

  // Get my enrolled courses (siswa)
  getMyEnrolledCourses: async (req, res) => {
    try {
      const { id: userId, role } = req.user;
      
      if (role !== 'siswa') {
        return res.status(403).json({
          success: false,
          message: 'Only students can access enrolled courses'
        });
      }

      const courses = await courseService.getEnrolledCourses(userId);
      
      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Get enrolled courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching enrolled courses',
        error: error.message
      });
    }
  },

  // Get my created courses (guru)
  getMyCreatedCourses: async (req, res) => {
    try {
      const { id: userId, role } = req.user;
      
      if (!['guru', 'admin'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Only teachers and admins can access created courses'
        });
      }

      const courses = await courseService.getCreatedCourses(userId);
      
      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Get created courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching created courses',
        error: error.message
      });
    }
  }
};

module.exports = courseController;