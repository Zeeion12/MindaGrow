const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const slugify = require('slugify');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Konfigurasi penyimpanan untuk banner kursus
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar'), false);
    }
  }
}).single('banner_image');

// Middleware untuk upload banner kursus
const uploadBanner = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Error upload: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    // Lanjut ke controller jika tidak ada error
    next();
  });
};

/**
 * Membuat kursus baru
 */
const createCourse = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      title,
      slug,
      description,
      short_description,
      category_id,
      level,
      is_featured,
      is_published,
      estimated_duration
    } = req.body;
    
    // Teacher ID dari token
    const teacher_id = req.user.id;
    
    // Validasi input
    if (!title || !description || !short_description || !category_id || !level || !estimated_duration) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }
    
    // Generate slug jika tidak disediakan
    let courseSlug = slug;
    if (!courseSlug) {
      courseSlug = slugify(title, { lower: true, strict: true });
    }
    
    // Cek apakah slug sudah ada
    const slugCheck = await client.query('SELECT id FROM courses WHERE slug = $1', [courseSlug]);
    if (slugCheck.rows.length > 0) {
      // Tambahkan random string ke slug
      const randomString = Math.random().toString(36).substring(2, 8);
      courseSlug = `${courseSlug}-${randomString}`;
    }
    
    // Proses banner image jika ada
    let bannerImageData = null;
    if (req.file) {
      // Convert buffer to base64
      bannerImageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    
    // Insert ke tabel courses
    const insertQuery = `
      INSERT INTO courses (
        title, slug, description, short_description, banner_image,
        category_id, teacher_id, level, is_featured, is_published, estimated_duration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      title,
      courseSlug,
      description,
      short_description,
      bannerImageData,
      category_id,
      teacher_id,
      level,
      is_featured || false,
      is_published || false,
      estimated_duration
    ];
    
    const result = await client.query(insertQuery, values);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Kursus berhasil dibuat',
      course: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating course:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ message: 'Slug kursus sudah digunakan' });
    } else {
      res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  } finally {
    client.release();
  }
};

/**
 * Mengupdate kursus
 */
const updateCourse = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      title,
      slug,
      description,
      short_description,
      category_id,
      level,
      is_featured,
      is_published,
      estimated_duration
    } = req.body;
    
    // Validasi input
    if (!title || !description || !short_description || !category_id || !level || !estimated_duration) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }
    
    // Teacher ID dari token
    const teacher_id = req.user.id;
    
    // Cek apakah kursus ada dan dimiliki oleh guru yang sedang login
    const courseCheck = await client.query(
      'SELECT * FROM courses WHERE id = $1 AND teacher_id = $2',
      [id, teacher_id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Kursus tidak ditemukan atau Anda tidak memiliki akses' });
    }
    
    // Generate slug jika tidak disediakan atau berubah
    let courseSlug = slug;
    if (!courseSlug || courseSlug !== courseCheck.rows[0].slug) {
      courseSlug = slugify(title, { lower: true, strict: true });
      
      // Cek apakah slug baru sudah ada
      const slugCheck = await client.query(
        'SELECT id FROM courses WHERE slug = $1 AND id <> $2',
        [courseSlug, id]
      );
      
      if (slugCheck.rows.length > 0) {
        // Tambahkan random string ke slug
        const randomString = Math.random().toString(36).substring(2, 8);
        courseSlug = `${courseSlug}-${randomString}`;
      }
    }
    
    // Proses banner image jika ada
    let bannerImageData = courseCheck.rows[0].banner_image;
    if (req.file) {
      // Convert buffer to base64
      bannerImageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    
    // Update kursus
    const updateQuery = `
      UPDATE courses
      SET 
        title = $1,
        slug = $2,
        description = $3,
        short_description = $4,
        banner_image = $5,
        category_id = $6,
        level = $7,
        is_featured = $8,
        is_published = $9,
        estimated_duration = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND teacher_id = $12
      RETURNING *
    `;
    
    const values = [
      title,
      courseSlug,
      description,
      short_description,
      bannerImageData,
      category_id,
      level,
      is_featured || false,
      is_published || false,
      estimated_duration,
      id,
      teacher_id
    ];
    
    const result = await client.query(updateQuery, values);
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Kursus berhasil diperbarui',
      course: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating course:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ message: 'Slug kursus sudah digunakan' });
    } else {
      res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  } finally {
    client.release();
  }
};

/**
 * Menghapus kursus
 */
const deleteCourse = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const teacher_id = req.user.id;
    
    // Cek apakah kursus ada dan dimiliki oleh guru yang sedang login
    const courseCheck = await client.query(
      'SELECT * FROM courses WHERE id = $1 AND teacher_id = $2',
      [id, teacher_id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Kursus tidak ditemukan atau Anda tidak memiliki akses' });
    }
    
    // Hapus kursus
    await client.query('DELETE FROM courses WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Kursus berhasil dihapus' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mendapatkan semua kursus (untuk guru tertentu)
 */
const getTeacherCourses = async (req, res) => {
  try {
    const teacher_id = req.user.id;
    
    // Query untuk mendapatkan semua kursus milik guru
    const query = `
      SELECT c.*, cat.name as category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.teacher_id = $1
      ORDER BY c.created_at DESC
    `;
    
    const result = await pool.query(query, [teacher_id]);
    
    res.json({
      message: 'Data kursus berhasil diambil',
      courses: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Mendapatkan detail kursus
 */
const getCourseDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Query untuk mendapatkan detail kursus
    const query = `
      SELECT c.*, cat.name as category_name, 
             u.id as teacher_user_id,
             g.nama_lengkap as teacher_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN guru g ON u.id = g.user_id
      WHERE c.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kursus tidak ditemukan' });
    }
    
    // Jika user adalah siswa, catat course view
    if (req.user.role === 'siswa') {
      await pool.query(
        'INSERT INTO course_views (course_id, student_id, viewed_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING',
        [id, req.user.id]
      );
    }
    
    res.json({
      message: 'Detail kursus berhasil diambil',
      course: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching course detail:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Mendapatkan kursus berdasarkan slug
 */
const getCourseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Query untuk mendapatkan detail kursus berdasarkan slug
    const query = `
      SELECT c.*, cat.name as category_name, 
             u.id as teacher_user_id,
             g.nama_lengkap as teacher_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN guru g ON u.id = g.user_id
      WHERE c.slug = $1
    `;
    
    const result = await pool.query(query, [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kursus tidak ditemukan' });
    }
    
    // Jika user adalah siswa, catat course view
    if (req.user && req.user.role === 'siswa') {
      await pool.query(
        'INSERT INTO course_views (course_id, student_id, viewed_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING',
        [result.rows[0].id, req.user.id]
      );
    }
    
    res.json({
      message: 'Detail kursus berhasil diambil',
      course: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching course by slug:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Mendapatkan semua kursus yang tersedia (published) untuk siswa
 */
const getAvailableCourses = async (req, res) => {
  try {
    const { category, level, search, sort } = req.query;
    
    // Buat query dasar
    let query = `
      SELECT c.*, cat.name as category_name, 
             g.nama_lengkap as teacher_name,
             (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN guru g ON u.id = g.user_id
      WHERE c.is_published = true
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Tambahkan filter kategori jika ada
    if (category) {
      query += ` AND c.category_id = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    // Tambahkan filter level jika ada
    if (level) {
      query += ` AND c.level = $${paramIndex}`;
      queryParams.push(level);
      paramIndex++;
    }
    
    // Tambahkan pencarian jika ada
    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex} OR c.short_description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Tambahkan sort
    if (sort === 'newest') {
      query += ` ORDER BY c.created_at DESC`;
    } else if (sort === 'oldest') {
      query += ` ORDER BY c.created_at ASC`;
    } else if (sort === 'popular') {
      query += ` ORDER BY student_count DESC`;
    } else if (sort === 'title') {
      query += ` ORDER BY c.title ASC`;
    } else {
      query += ` ORDER BY c.is_featured DESC, c.created_at DESC`;
    }
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      message: 'Data kursus berhasil diambil',
      courses: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching available courses:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Mendapatkan kursus yang diikuti oleh siswa
 */
const getEnrolledCourses = async (req, res) => {
  try {
    const student_id = req.user.id;
    
    const query = `
      SELECT c.*, cat.name as category_name,
             g.nama_lengkap as teacher_name,
             e.enrolled_at,
             e.last_accessed_at,
             (
               SELECT COUNT(*) FROM lesson_progress lp
               JOIN lessons l ON lp.lesson_id = l.id
               JOIN modules m ON l.module_id = m.id
               WHERE m.course_id = c.id AND lp.student_id = $1 AND lp.completed = true
             ) as completed_lessons,
             (
               SELECT COUNT(*) FROM lessons l
               JOIN modules m ON l.module_id = m.id
               WHERE m.course_id = c.id
             ) as total_lessons
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN guru g ON u.id = g.user_id
      WHERE e.student_id = $1
      ORDER BY e.last_accessed_at DESC
    `;
    
    const result = await pool.query(query, [student_id]);
    
    res.json({
      message: 'Data kursus berhasil diambil',
      courses: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Mendaftarkan siswa ke kursus
 */
const enrollCourse = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { course_id } = req.body;
    const student_id = req.user.id;
    
    // Periksa apakah kursus ada dan dipublikasikan
    const courseCheck = await client.query(
      'SELECT * FROM courses WHERE id = $1 AND is_published = true',
      [course_id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Kursus tidak ditemukan atau tidak tersedia' });
    }
    
    // Periksa apakah siswa sudah terdaftar di kursus ini
    const enrollmentCheck = await client.query(
      'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [course_id, student_id]
    );
    
    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Anda sudah terdaftar di kursus ini' });
    }
    
    // Daftarkan siswa ke kursus
    await client.query(
      'INSERT INTO enrollments (course_id, student_id, enrolled_at, last_accessed_at) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [course_id, student_id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({ message: 'Berhasil mendaftar ke kursus' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error enrolling course:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mendapatkan semua kategori
 */
const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    
    res.json({
      message: 'Data kategori berhasil diambil',
      categories: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = {
  uploadBanner,
  createCourse,
  updateCourse,
  deleteCourse,
  getTeacherCourses,
  getCourseDetail,
  getCourseBySlug,
  getAvailableCourses,
  getEnrolledCourses,
  enrollCourse,
  getCategories
};