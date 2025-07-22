// server/routes/courses.js - Temporary version tanpa users table
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create pool connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Ensure upload directories exist
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Initialize upload directories
createUploadDir('./uploads/courses');

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/courses');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `course-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer configuration - Update to accept multiple field names
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create upload middleware that accepts both field names
const uploadCourseImage = (req, res, next) => {
  // Accept multiple field names for flexibility
  const uploadSingle = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 }
  ]);
  
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('📁 Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    
    // Normalize file object - use whichever field was uploaded
    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        req.file = req.files.thumbnail[0];
        console.log('📁 File uploaded as thumbnail:', req.file.filename);
      } else if (req.files.banner_image && req.files.banner_image[0]) {
        req.file = req.files.banner_image[0];
        console.log('📁 File uploaded as banner_image:', req.file.filename);
      }
    }
    
    console.log('📁 Final req.file:', req.file ? req.file.filename : 'No file');
    next();
  });
};

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

// GET /api/courses/test
router.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      success: true,
      message: 'Database connection working',
      timestamp: result.rows[0].current_time
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// GET /api/courses/categories
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 Fetching categories...');
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    
    console.log(`✅ Categories found: ${result.rows.length}`);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// GET /api/courses
router.get('/', optionalAuth, async (req, res) => {
  try {
    console.log('📚 Fetching courses...');
    
    const { search = '', category = '', level = '', page = 1, limit = 12 } = req.query;

    let whereConditions = ["c.status = 'active'"];
    let queryParams = [];

    // Add search filter
    if (search) {
      queryParams.push(`%${search}%`);
      whereConditions.push(`(c.title ILIKE $${queryParams.length} OR c.description ILIKE $${queryParams.length})`);
    }

    // Add category filter
    if (category) {
      queryParams.push(category);
      whereConditions.push(`c.category_id = $${queryParams.length}`);
    }

    // Add level filter
    if (level) {
      queryParams.push(level);
      whereConditions.push(`c.level = $${queryParams.length}`);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Simplified query without users table
    const coursesQuery = `
      SELECT 
        c.*,
        cat.name as category_name,
        COALESCE(g.nama_lengkap, 'Administrator') as instructor_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as enrolled_count,
        0 as average_rating,
        0 as review_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN guru g ON c.instructor_id = g.user_id
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);

    const coursesResult = await pool.query(coursesQuery, queryParams);

    console.log(`✅ Courses found: ${coursesResult.rows.length}`);

    // Convert thumbnails to full URLs
    const coursesWithUrls = coursesResult.rows.map(course => ({
      ...course,
      thumbnail: course.thumbnail ? `${req.protocol}://${req.get('host')}/${course.thumbnail}` : null
    }));
    
    res.json({
      success: true,
      data: coursesWithUrls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: 1,
        totalItems: coursesResult.rows.length,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// GET /api/courses/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching course ID: ${id}`);

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const courseQuery = `
      SELECT 
        c.*,
        cat.name as category_name,
        COALESCE(g.nama_lengkap, 'Administrator') as instructor_name,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as enrolled_count,
        0 as average_rating,
        0 as review_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN guru g ON c.instructor_id = g.user_id
      WHERE c.id = $1
    `;

    const courseResult = await pool.query(courseQuery, [id]);
    
    if (courseResult.rows.length === 0) {
      console.log(`❌ Course not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const course = courseResult.rows[0];
    console.log(`✅ Course found: ${course.title}`);

    // Convert thumbnail to full URL or provide default
    if (course.thumbnail) {
      course.thumbnail = `${req.protocol}://${req.get('host')}/${course.thumbnail}`;
    } else {
      // Provide a default background image URL or gradient
      course.thumbnail = null; // Frontend will handle gradient fallback
    }

    // Add default background info for frontend
    course.has_custom_thumbnail = !!course.thumbnail;

    res.json({
      success: true,
      data: {
        ...course,
        modules: [],
        is_enrolled: 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching course details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course details',
      error: error.message
    });
  }
});

// POST /api/courses - SIMPLIFIED VERSION
router.post('/', authenticateToken, uploadCourseImage, async (req, res) => {
  try {
    console.log('🚀 POST /courses - Request received');
    console.log('👤 User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    console.log('📋 Body keys:', Object.keys(req.body));
    console.log('📋 Body values:', req.body);
    console.log('📁 Files:', req.files ? Object.keys(req.files) : 'No files');
    console.log('📁 File:', req.file ? req.file.filename : 'No file');

    const { title, description, category_id, level, price } = req.body;

    // Basic validation
    if (!title) {
      console.log('❌ Missing title');
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!description) {
      console.log('❌ Missing description');
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    if (!category_id) {
      console.log('❌ Missing category_id');
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Test database connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection OK');

    const insertQuery = `
      INSERT INTO courses (
        title, description, category_id, 
        level, price, status, instructor_id, instructor_role,
        thumbnail, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, title
    `;

    console.log('🔍 Executing query with params:', [
      title.trim(),
      description.trim(),
      parseInt(category_id),
      level || 'beginner',
      parseFloat(price) || 0,
      'active',
      req.user.id,
      'guru',
      req.file ? req.file.path : null
    ]);

    const result = await pool.query(insertQuery, [
      title.trim(),
      description.trim(),
      parseInt(category_id),
      level || 'beginner',
      parseFloat(price) || 0,
      'active',
      req.user.id,
      'guru',
      req.file ? req.file.path : null
    ]);

    const newCourse = result.rows[0];
    
    console.log(`✅ Course created successfully: ${newCourse.title} (ID: ${newCourse.id})`);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse
    });

  } catch (error) {
    console.error('❌ Detailed error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });

    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
});

// PUT /api/courses/:id
router.put('/:id', authenticateToken, uploadCourseImage, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, level, price, status } = req.body;

    console.log(`✏️ Updating course ID: ${id}`);
    console.log('📁 New file uploaded:', req.file?.filename);

    const courseCheck = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const existingCourse = courseCheck.rows[0];

    if (req.user.role !== 'admin' && req.user.id !== existingCourse.instructor_id) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    let thumbnailPath = existingCourse.thumbnail;
    if (req.file) {
      if (existingCourse.thumbnail) {
        try {
          fs.unlinkSync(existingCourse.thumbnail);
          console.log('🗑️ Old thumbnail deleted');
        } catch (e) {
          console.log('⚠️ Could not delete old thumbnail');
        }
      }
      thumbnailPath = req.file.path;
    }

    const updateQuery = `
      UPDATE courses SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        level = COALESCE($4, level),
        price = COALESCE($5, price),
        status = COALESCE($6, status),
        thumbnail = COALESCE($7, thumbnail),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [
      title?.trim(),
      description?.trim(),
      category_id ? parseInt(category_id) : null,
      level,
      price ? parseFloat(price) : null,
      status,
      thumbnailPath,
      id
    ]);

    const updatedCourse = updateResult.rows[0];
    
    if (updatedCourse.thumbnail) {
      updatedCourse.thumbnail = `${req.protocol}://${req.get('host')}/${updatedCourse.thumbnail}`;
    }

    console.log(`✅ Course updated: ${updatedCourse.title}`);

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });

  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    
    console.error('❌ Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
});

// DELETE /api/courses/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const courseCheck = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const course = courseCheck.rows[0];

    if (req.user.role !== 'admin' && req.user.id !== course.instructor_id) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    await pool.query(
      'UPDATE courses SET status = $1, updated_at = NOW() WHERE id = $2',
      ['deleted', id]
    );

    console.log(`✅ Course deleted: ${course.title}`);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
});

// POST /api/courses/:id/enroll
router.post('/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`👥 Enroll request - Course: ${id}, User: ${userId}, Role: ${req.user.role}`);

    // Validate course ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    if (req.user.role !== 'siswa') {
      console.log(`❌ Enroll denied - User role: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Only students can enroll in courses'
      });
    }

    const courseCheck = await pool.query(
      'SELECT id, title FROM courses WHERE id = $1 AND status = $2',
      [id, 'active']
    );

    if (courseCheck.rows.length === 0) {
      console.log(`❌ Course not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const course = courseCheck.rows[0];

    const enrollmentCheck = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, id]
    );

    if (enrollmentCheck.rows.length > 0) {
      console.log(`❌ Already enrolled - User: ${userId}, Course: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    await pool.query(
      'INSERT INTO enrollments (user_id, course_id, status, enrolled_at) VALUES ($1, $2, $3, NOW())',
      [userId, id, 'active']
    );

    console.log(`✅ Enrollment successful - User: ${userId}, Course: ${course.title}`);

    res.json({
      success: true,
      message: 'Successfully enrolled in course'
    });

  } catch (error) {
    console.error('❌ Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
});

// DELETE /api/courses/:id/enroll
router.delete('/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE enrollments SET status = $1 WHERE user_id = $2 AND course_id = $3 RETURNING id',
      ['cancelled', userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });

  } catch (error) {
    console.error('❌ Error unenrolling from course:', error);
    res.status(500).json({
      success: false,
      message: 'Error unenrolling from course',
      error: error.message
    });
  }
});

// GET /api/courses/enrolled - Get enrolled courses for student
router.get('/enrolled', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📚 Getting enrolled courses for user: ${userId}`);

    if (req.user.role !== 'siswa') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view enrolled courses'
      });
    }

    const enrolledQuery = `
      SELECT 
        c.*,
        cat.name as category_name,
        COALESCE(g.nama_lengkap, 'Administrator') as instructor_name,
        e.enrolled_at,
        e.status as enrollment_status
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN guru g ON c.instructor_id = g.user_id
      WHERE e.user_id = $1 AND e.status = 'active' AND c.status = 'active'
      ORDER BY e.enrolled_at DESC
    `;

    const result = await pool.query(enrolledQuery, [userId]);

    // Convert thumbnails to full URLs
    const coursesWithUrls = result.rows.map(course => ({
      ...course,
      thumbnail: course.thumbnail ? `${req.protocol}://${req.get('host')}/${course.thumbnail}` : null
    }));

    console.log(`✅ Found ${coursesWithUrls.length} enrolled courses`);

    res.json({
      success: true,
      data: coursesWithUrls
    });

  } catch (error) {
    console.error('❌ Error fetching enrolled courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses',
      error: error.message
    });
  }
});

// GET /api/courses/:id/learning - Get course learning data (enrolled students only)
router.get('/:id/learning', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📚 Learning request - Course: ${id}, User: ${userId}`);

    // Check if user is enrolled
    const enrollmentQuery = `
      SELECT id FROM enrollments 
      WHERE user_id = $1 AND course_id = $2 AND status = 'active'
    `;
    const enrollmentResult = await pool.query(enrollmentQuery, [userId, id]);
    
    if (enrollmentResult.rows.length === 0) {
      console.log(`❌ User ${userId} not enrolled in course ${id}`);
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled to access course content'
      });
    }

    // Get course with basic info
    const courseQuery = `
      SELECT 
        c.*,
        cat.name as category_name,
        COALESCE(g.nama_lengkap, 'Administrator') as instructor_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN guru g ON c.instructor_id = g.user_id
      WHERE c.id = $1 AND c.status = 'active'
    `;

    const courseResult = await pool.query(courseQuery, [id]);
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const course = courseResult.rows[0];

    // Convert thumbnail to full URL
    if (course.thumbnail) {
      course.thumbnail = `${req.protocol}://${req.get('host')}/${course.thumbnail}`;
    }

    console.log(`✅ Learning access granted for course: ${course.title}`);

    res.json({
      success: true,
      data: {
        ...course,
        modules: [], // Will be populated later when modules table is ready
        is_enrolled: true
      }
    });

  } catch (error) {
    console.error('❌ Error fetching learning data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course learning data',
      error: error.message
    });
  }
});

module.exports = router;