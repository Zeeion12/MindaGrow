const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const router = express.Router();

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Auth middleware
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

// Optional auth middleware
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Configure multer for course uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'courses');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Course service functions
const courseService = {
  // Get all courses with filters
  getAllCourses: async (page, limit, filters) => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE c.status = $1';
      const queryParams = ['active'];
      let paramCount = 1;

      if (filters.category) {
        paramCount++;
        whereClause += ` AND c.category_id = $${paramCount}`;
        queryParams.push(filters.category);
      }

      if (filters.search) {
        paramCount++;
        whereClause += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount + 1})`;
        queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
        paramCount++;
      }

      if (filters.level) {
        paramCount++;
        whereClause += ` AND c.level = $${paramCount}`;
        queryParams.push(filters.level);
      }

      const coursesQuery = `
        SELECT 
          c.id,
          c.title,
          c.description,
          c.thumbnail,
          c.price,
          c.level,
          c.duration,
          c.created_at,
          COALESCE(cat.name, 'Uncategorized') as category_name,
          CASE 
            WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
            WHEN c.instructor_role = 'admin' THEN 'Administrator'
            ELSE 'Unknown'
          END as instructor_name,
          COUNT(DISTINCT e.id) as enrolled_count,
          AVG(cr.rating) as average_rating,
          COUNT(DISTINCT cr.id) as review_count
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN course_ratings cr ON c.id = cr.course_id
        ${whereClause}
        GROUP BY c.id, cat.name, g.nama_lengkap
        ORDER BY c.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        ${whereClause}
      `;

      queryParams.push(parseInt(limit), parseInt(offset));

      const coursesResult = await pool.query(coursesQuery, queryParams);
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      return {
        courses: coursesResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      console.error('Error in getAllCourses:', error);
      throw new Error(`Error fetching courses: ${error.message}`);
    }
  },

  // Get course by ID
  getCourseById: async (courseId, userId = null) => {
    try {
      let query = `
        SELECT 
          c.*,
          COALESCE(cat.name, 'Uncategorized') as category_name,
          CASE 
            WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
            WHEN c.instructor_role = 'admin' THEN 'Administrator'
            ELSE 'Unknown'
          END as instructor_name,
          COUNT(DISTINCT e.id) as enrolled_count,
          AVG(cr.rating) as average_rating,
          COUNT(DISTINCT cr.id) as review_count
      `;

      let params = [courseId];
      
      if (userId) {
        query += `, 
          CASE WHEN user_enrollment.id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled`;
      } else {
        query += `, 0 as is_enrolled`;
      }

      query += `
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN course_ratings cr ON c.id = cr.course_id
      `;

      if (userId) {
        query += `
          LEFT JOIN enrollments user_enrollment ON c.id = user_enrollment.course_id AND user_enrollment.user_id = $2
        `;
        params.push(userId);
      }

      query += `
        WHERE c.id = $1 AND c.status = 'active'
        GROUP BY c.id, cat.name, g.nama_lengkap
      `;

      if (userId) {
        query += `, user_enrollment.id`;
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      const course = result.rows[0];

      // Get course modules
      try {
        const modulesQuery = `
          SELECT id, title, description, duration, order_index
          FROM modules
          WHERE course_id = $1
          ORDER BY order_index ASC
        `;
        const modulesResult = await pool.query(modulesQuery, [courseId]);
        course.modules = modulesResult.rows;
      } catch (error) {
        course.modules = [];
      }

      // Get recent reviews
      try {
        const reviewsQuery = `
          SELECT 
            cr.rating,
            cr.comment,
            cr.created_at,
            COALESCE(
              CASE 
                WHEN u.role = 'siswa' THEN s.nama_lengkap
                WHEN u.role = 'guru' THEN g.nama_lengkap
                WHEN u.role = 'orangtua' THEN o.nama_lengkap
                ELSE 'Anonymous'
              END, 'Anonymous'
            ) as user_name
          FROM course_ratings cr
          JOIN users u ON cr.user_id = u.id
          LEFT JOIN siswa s ON u.id = s.user_id AND u.role = 'siswa'
          LEFT JOIN guru g ON u.id = g.user_id AND u.role = 'guru'  
          LEFT JOIN orangtua o ON u.id = o.user_id AND u.role = 'orangtua'
          WHERE cr.course_id = $1
          ORDER BY cr.created_at DESC
          LIMIT 5
        `;
        const reviewsResult = await pool.query(reviewsQuery, [courseId]);
        course.recent_reviews = reviewsResult.rows;
      } catch (error) {
        course.recent_reviews = [];
      }

      return course;
    } catch (error) {
      console.error('Error in getCourseById:', error);
      throw new Error(`Error fetching course: ${error.message}`);
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const query = `
        SELECT 
          cat.*,
          COUNT(c.id) as course_count
        FROM categories cat
        LEFT JOIN courses c ON cat.id = c.category_id AND c.status = 'active'
        GROUP BY cat.id
        ORDER BY cat.name ASC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  },

  // Get popular courses
  getPopularCourses: async (limit = 6) => {
    try {
      const query = `
        SELECT 
          c.*,
          cat.name as category_name,
          CASE 
            WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
            WHEN c.instructor_role = 'admin' THEN 'Administrator'
            ELSE 'Unknown'
          END as instructor_name,
          COUNT(DISTINCT e.id) as enrolled_count,
          AVG(cr.rating) as average_rating,
          COUNT(DISTINCT cr.id) as review_count
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
        LEFT JOIN course_ratings cr ON c.id = cr.course_id
        WHERE c.status = 'active'
        GROUP BY c.id, cat.name, g.nama_lengkap
        ORDER BY enrolled_count DESC, average_rating DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [parseInt(limit)]);
      return result.rows;
    } catch (error) {
      console.error('Error in getPopularCourses:', error);
      throw new Error(`Error fetching popular courses: ${error.message}`);
    }
  },

  // Get new courses
  getNewCourses: async (limit = 6) => {
    try {
      const query = `
        SELECT 
          c.*,
          cat.name as category_name,
          CASE 
            WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
            WHEN c.instructor_role = 'admin' THEN 'Administrator'
            ELSE 'Unknown'
          END as instructor_name,
          COUNT(DISTINCT e.id) as enrolled_count,
          AVG(cr.rating) as average_rating,
          COUNT(DISTINCT cr.id) as review_count
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
        LEFT JOIN course_ratings cr ON c.id = cr.course_id
        WHERE c.status = 'active'
        GROUP BY c.id, cat.name, g.nama_lengkap
        ORDER BY c.created_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [parseInt(limit)]);
      return result.rows;
    } catch (error) {
      console.error('Error in getNewCourses:', error);
      throw new Error(`Error fetching new courses: ${error.message}`);
    }
  }
};

// ===============================
// COURSE ROUTES
// ===============================

// GET /api/courses - Get all courses with pagination and filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, level } = req.query;
    const filters = { category, search, level };
    
    console.log('GET /api/courses - filters:', filters);
    
    const result = await courseService.getAllCourses(page, limit, filters);
    
    // Convert thumbnails to full URLs
    const coursesWithUrls = result.courses.map(course => ({
      ...course,
      thumbnail: course.thumbnail ? `${req.protocol}://${req.get('host')}/${course.thumbnail}` : null
    }));
    
    res.json({
      success: true,
      data: coursesWithUrls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.total / limit),
        totalItems: result.total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('GET /api/courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// GET /api/courses/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await courseService.getCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('GET /api/courses/categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// GET /api/courses/popular - Get popular courses
router.get('/popular', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    console.log('GET /api/courses/popular - limit:', limit);
    
    const courses = await courseService.getPopularCourses(limit);
    
    // Convert thumbnails to full URLs
    const coursesWithUrls = courses.map(course => ({
      ...course,
      thumbnail: course.thumbnail ? `${req.protocol}://${req.get('host')}/${course.thumbnail}` : null
    }));
    
    res.json({
      success: true,
      data: coursesWithUrls
    });
  } catch (error) {
    console.error('GET /api/courses/popular error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular courses',
      error: error.message
    });
  }
});

// GET /api/courses/new - Get new courses
router.get('/new', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    console.log('GET /api/courses/new - limit:', limit);
    
    const courses = await courseService.getNewCourses(limit);
    
    // Convert thumbnails to full URLs
    const coursesWithUrls = courses.map(course => ({
      ...course,
      thumbnail: course.thumbnail ? `${req.protocol}://${req.get('host')}/${course.thumbnail}` : null
    }));
    
    res.json({
      success: true,
      data: coursesWithUrls
    });
  } catch (error) {
    console.error('GET /api/courses/new error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching new courses',
      error: error.message
    });
  }
});

// POST /api/courses - Create new course
router.post('/', 
  authenticateToken, 
  async (req, res, next) => {
    // Check authorization: only guru and admin can create courses
    if (req.user.role !== 'guru' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can create courses'
      });
    }
    next();
  },
  upload.single('banner_image'),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category_id,
        level = 'beginner',
        duration = 60,
        price = 0,
        instructor_id
      } = req.body;

      console.log('Creating course with data:', {
        title,
        description,
        category_id,
        level,
        duration,
        price,
        instructor_id,
        user_role: req.user.role,
        user_id: req.user.id
      });

      // Validation
      if (!title || !description || !category_id) {
        // Clean up uploaded file
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          errors: {
            title: !title ? ['Title is required'] : [],
            description: !description ? ['Description is required'] : [],
            category_id: !category_id ? ['Category is required'] : []
          }
        });
      }

      // Verify category exists
      const categoryResult = await pool.query('SELECT id FROM categories WHERE id = $1', [category_id]);
      if (categoryResult.rows.length === 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({
          success: false,
          message: 'Invalid category',
          errors: {
            category_id: ['Category not found']
          }
        });
      }

      // Determine instructor
      let finalInstructorId = instructor_id || req.user.id;
      let instructorRole = 'guru';

      // If admin is creating course, they can assign to any teacher or themselves
      if (req.user.role === 'admin') {
        if (instructor_id) {
          // Verify instructor exists and is a teacher
          const instructorResult = await pool.query(
            'SELECT id, role FROM users WHERE id = $1 AND (role = $2 OR role = $3)', 
            [instructor_id, 'guru', 'admin']
          );
          
          if (instructorResult.rows.length === 0) {
            if (req.file) {
              fs.unlinkSync(req.file.path);
            }
            
            return res.status(400).json({
              success: false,
              message: 'Invalid instructor',
              errors: {
                instructor_id: ['Instructor not found or invalid role']
              }
            });
          }
          
          instructorRole = instructorResult.rows[0].role;
        } else {
          // Admin creating for themselves
          instructorRole = 'admin';
        }
      }

      // Prepare course data
      const courseData = {
        title: title.trim(),
        description: description.trim(),
        category_id: parseInt(category_id),
        instructor_id: finalInstructorId,
        instructor_role: instructorRole,
        level: level || 'beginner',
        duration: parseInt(duration) || 60,
        price: parseFloat(price) || 0,
        created_by: req.user.id,
        status: 'active',
        thumbnail: req.file ? `uploads/courses/${req.file.filename}` : null
      };

      // Create course
      const insertQuery = `
        INSERT INTO courses (
          title, description, category_id, instructor_id, instructor_role,
          level, duration, price, created_by, status, thumbnail,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id
      `;

      const courseResult = await pool.query(insertQuery, [
        courseData.title,
        courseData.description,
        courseData.category_id,
        courseData.instructor_id,
        courseData.instructor_role,
        courseData.level,
        courseData.duration,
        courseData.price,
        courseData.created_by,
        courseData.status,
        courseData.thumbnail
      ]);

      const newCourseId = courseResult.rows[0].id;

      // Fetch complete course data with relations
      const completeQuery = `
        SELECT 
          c.*,
          cat.name as category_name,
          CASE 
            WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
            WHEN c.instructor_role = 'admin' THEN 'Administrator'
            ELSE 'Unknown'
          END as instructor_name
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
        WHERE c.id = $1
      `;

      const completeResult = await pool.query(completeQuery, [newCourseId]);
      const courseWithDetails = completeResult.rows[0];

      // Convert thumbnail to full URL if exists
      if (courseWithDetails.thumbnail) {
        courseWithDetails.thumbnail = `${req.protocol}://${req.get('host')}/${courseWithDetails.thumbnail}`;
      }

      console.log('Course created successfully:', courseWithDetails.title);

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: courseWithDetails
      });

    } catch (error) {
      console.error('Error creating course:', error);

      // Clean up uploaded file if error occurs
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      // Handle database constraint errors
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          message: 'Course with this title already exists',
          errors: {
            title: ['Title must be unique']
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// GET /api/courses/instructor/:instructorId - Get courses by instructor
router.get('/instructor/:instructorId', 
  authenticateToken,
  async (req, res) => {
    try {
      const { instructorId } = req.params;
      const { page = 1, limit = 12 } = req.query;
      
      console.log('Getting courses for instructor:', instructorId);

      // Check authorization - users can only see their own courses unless admin
      if (req.user.role !== 'admin' && req.user.id !== parseInt(instructorId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own courses'
        });
      }

      const offset = (page - 1) * limit;

      const coursesQuery = `
        SELECT 
          c.*,
          cat.name as category_name,
          COUNT(DISTINCT e.id) as enrolled_count,
          AVG(cr.rating) as average_rating,
          COUNT(DISTINCT cr.id) as review_count
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
        LEFT JOIN course_ratings cr ON c.id = cr.course_id
        WHERE c.instructor_id = $1 AND c.status = 'active'
        GROUP BY c.id, cat.name
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM courses c
        WHERE c.instructor_id = $1 AND c.status = 'active'
      `;

      const coursesResult = await pool.query(coursesQuery, [instructorId, parseInt(limit), parseInt(offset)]);
      const countResult = await pool.query(countQuery, [instructorId]);

      // Convert thumbnails to full URLs
      const courses = coursesResult.rows.map(course => ({
        ...course,
        thumbnail: course.thumbnail ? `${req.protocol}://${req.get('host')}/${course.thumbnail}` : null
      }));

      res.json({
        success: true,
        data: courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResult.rows[0].total / limit),
          totalItems: parseInt(countResult.rows[0].total),
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error getting instructor courses:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching instructor courses'
      });
    }
  }
);

// GET /api/courses/:id - Get course by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    console.log('GET /api/courses/:id - params:', { id, userId });
    
    const course = await courseService.getCourseById(id, userId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Convert thumbnail to full URL
    if (course.thumbnail) {
      course.thumbnail = `${req.protocol}://${req.get('host')}/${course.thumbnail}`;
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('GET /api/courses/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// PUT /api/courses/:id - Update course
router.put('/:id',
  authenticateToken,
  async (req, res, next) => {
    // Check authorization
    if (req.user.role !== 'guru' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can update courses'
      });
    }
    next();
  },
  upload.single('banner_image'),
  async (req, res) => {
    try {
      const courseId = req.params.id;
      const {
        title,
        description,
        category_id,
        level,
        duration,
        price,
        status
      } = req.body;

      console.log('Updating course:', courseId, 'with data:', req.body);

      // Find existing course
      const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
      if (courseResult.rows.length === 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const course = courseResult.rows[0];

      // Check permission (only course instructor or admin can update)
      if (req.user.role !== 'admin' && course.instructor_id !== req.user.id) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this course'
        });
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date()
      };

      if (title) updateData.title = title.trim();
      if (description) updateData.description = description.trim();
      if (category_id) updateData.category_id = parseInt(category_id);
      if (level) updateData.level = level;
      if (duration) updateData.duration = parseInt(duration);
      if (price !== undefined) updateData.price = parseFloat(price);
      if (status) updateData.status = status;

      // Handle thumbnail upload
      if (req.file) {
        // Delete old thumbnail if exists
        if (course.thumbnail && !course.thumbnail.startsWith('http')) {
          const oldPath = path.join(__dirname, '..', course.thumbnail);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        updateData.thumbnail = `uploads/courses/${req.file.filename}`;
      }

      // Build dynamic update query
      const setClause = Object.keys(updateData).map((key, index) => `${key} = ${index + 2}`).join(', ');
      const values = [courseId, ...Object.values(updateData)];

      const updateQuery = `UPDATE courses SET ${setClause} WHERE id = $1 RETURNING id`;
      await pool.query(updateQuery, values);

      // Fetch updated course with relations
      const completeQuery = `
        SELECT 
          c.*,
          cat.name as category_name,
          CASE 
            WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
            WHEN c.instructor_role = 'admin' THEN 'Administrator'
            ELSE 'Unknown'
          END as instructor_name
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
        WHERE c.id = $1
      `;

      const updatedResult = await pool.query(completeQuery, [courseId]);
      const updatedCourse = updatedResult.rows[0];

      // Convert thumbnail to full URL
      if (updatedCourse.thumbnail) {
        updatedCourse.thumbnail = `${req.protocol}://${req.get('host')}/${updatedCourse.thumbnail}`;
      }

      res.json({
        success: true,
        message: 'Course updated successfully',
        data: updatedCourse
      });

    } catch (error) {
      console.error('Error updating course:', error);

      // Clean up uploaded file if error occurs
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// DELETE /api/courses/:id - Delete course
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const courseId = req.params.id;

      // Check authorization
      if (req.user.role !== 'guru' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only teachers and admins can delete courses'
        });
      }

      // Find course
      const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
      if (courseResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const course = courseResult.rows[0];

      // Check permission
      if (req.user.role !== 'admin' && course.instructor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this course'
        });
      }

      // Check if course has enrollments
      const enrollmentResult = await pool.query(
        'SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1',
        [courseId]
      );

      const enrollmentCount = parseInt(enrollmentResult.rows[0].count);
      if (enrollmentCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete course with active enrollments'
        });
      }

      // Delete course thumbnail if exists
      if (course.thumbnail && !course.thumbnail.startsWith('http')) {
        const thumbnailPath = path.join(__dirname, '..', course.thumbnail);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }

      // Delete course (modules and lessons will be deleted by CASCADE)
      await pool.query('DELETE FROM courses WHERE id = $1', [courseId]);

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// POST /api/courses/:id/enroll - Enroll in course
router.post('/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;
    
    console.log('POST /api/courses/:id/enroll - params:', { id, userId, role });
    
    if (role !== 'siswa') {
      return res.status(403).json({
        success: false,
        message: 'Only students can enroll in courses'
      });
    }

    // Check if course exists
    const courseResult = await pool.query('SELECT id FROM courses WHERE id = $1 AND status = $2', [id, 'active']);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const checkQuery = 'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2';
    const existing = await pool.query(checkQuery, [userId, id]);

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Create enrollment
    const query = `
      INSERT INTO enrollments (user_id, course_id, enrolled_at, status)
      VALUES ($1, $2, NOW(), 'active')
      RETURNING id
    `;

    const result = await pool.query(query, [userId, id]);
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: { id: result.rows[0].id, user_id: userId, course_id: id }
    });
  } catch (error) {
    console.error('POST /api/courses/:id/enroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
});

// DELETE /api/courses/:id/unenroll - Unenroll from course
router.delete('/:id/unenroll', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;
    
    console.log('DELETE /api/courses/:id/unenroll - params:', { id, userId, role });
    
    if (role !== 'siswa') {
      return res.status(403).json({
        success: false,
        message: 'Only students can unenroll from courses'
      });
    }

    const query = 'DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2';
    await pool.query(query, [userId, id]);
    
    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    console.error('DELETE /api/courses/:id/unenroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unenrolling from course',
      error: error.message
    });
  }
});

module.exports = router;