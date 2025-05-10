const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

/**
 * Membuat modul baru dalam kursus
 */
const createModule = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { course_id, title, description, position } = req.body;
    const teacher_id = req.user.id;
    
    // Validasi input
    if (!course_id || !title) {
      return res.status(400).json({ message: 'Judul dan ID kursus wajib diisi' });
    }
    
    // Cek apakah kursus ada dan dimiliki oleh guru yang sedang login
    const courseCheck = await client.query(
      'SELECT * FROM courses WHERE id = $1 AND teacher_id = $2',
      [course_id, teacher_id]
    );
    
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Kursus tidak ditemukan atau Anda tidak memiliki akses' });
    }
    
    // Tentukan posisi jika tidak disediakan
    let modulePosition = position;
    if (!modulePosition) {
      const positionResult = await client.query(
        'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM modules WHERE course_id = $1',
        [course_id]
      );
      modulePosition = positionResult.rows[0].next_position;
    }
    
    // Insert modul baru
    const insertQuery = `
      INSERT INTO modules (course_id, title, description, position)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [course_id, title, description || '', modulePosition]);
    
    // Update jumlah modul di tabel kursus
    await client.query(
      'UPDATE courses SET total_modules = (SELECT COUNT(*) FROM modules WHERE course_id = $1), updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [course_id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Modul berhasil dibuat',
      module: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating module:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mengupdate modul
 */
const updateModule = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { title, description, position } = req.body;
    const teacher_id = req.user.id;
    
    // Validasi input
    if (!title) {
      return res.status(400).json({ message: 'Judul modul wajib diisi' });
    }
    
    // Cek apakah modul ada dan dimiliki oleh guru yang sedang login
    const moduleCheck = await client.query(`
      SELECT m.*, c.teacher_id 
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = $1
    `, [id]);
    
    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Modul tidak ditemukan' });
    }
    
    if (moduleCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk mengubah modul ini' });
    }
    
    // Update modul
    const updateQuery = `
      UPDATE modules
      SET title = $1, description = $2, position = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      title,
      description || moduleCheck.rows[0].description,
      position || moduleCheck.rows[0].position,
      id
    ]);
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Modul berhasil diperbarui',
      module: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Menghapus modul
 */
const deleteModule = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const teacher_id = req.user.id;
    
    // Cek apakah modul ada dan dimiliki oleh guru yang sedang login
    const moduleCheck = await client.query(`
      SELECT m.*, c.teacher_id, c.id as course_id
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = $1
    `, [id]);
    
    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Modul tidak ditemukan' });
    }
    
    if (moduleCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menghapus modul ini' });
    }
    
    const course_id = moduleCheck.rows[0].course_id;
    
    // Hapus modul (cascade akan menghapus semua pelajaran di dalamnya)
    await client.query('DELETE FROM modules WHERE id = $1', [id]);
    
    // Update jumlah modul dan pelajaran di tabel kursus
    await client.query(`
      UPDATE courses 
      SET 
        total_modules = (SELECT COUNT(*) FROM modules WHERE course_id = $1),
        total_lessons = (
          SELECT COUNT(*) FROM lessons l
          JOIN modules m ON l.module_id = m.id
          WHERE m.course_id = $1
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [course_id]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Modul berhasil dihapus' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Membuat pelajaran baru dalam modul
 */
const createLesson = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { module_id, title, content, duration, position, lesson_type } = req.body;
    const teacher_id = req.user.id;
    
    // Validasi input
    if (!module_id || !title || !content) {
      return res.status(400).json({ message: 'ID modul, judul, dan konten wajib diisi' });
    }
    
    // Cek apakah modul ada dan dimiliki oleh guru yang sedang login
    const moduleCheck = await client.query(`
      SELECT m.*, c.teacher_id, c.id as course_id
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = $1
    `, [module_id]);
    
    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Modul tidak ditemukan' });
    }
    
    if (moduleCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menambah pelajaran di modul ini' });
    }
    
    const course_id = moduleCheck.rows[0].course_id;
    
    // Tentukan posisi jika tidak disediakan
    let lessonPosition = position;
    if (!lessonPosition) {
      const positionResult = await client.query(
        'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM lessons WHERE module_id = $1',
        [module_id]
      );
      lessonPosition = positionResult.rows[0].next_position;
    }
    
    // Insert pelajaran baru
    const insertQuery = `
      INSERT INTO lessons (module_id, title, content, duration, position, lesson_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      module_id, 
      title, 
      content, 
      duration || 0, 
      lessonPosition,
      lesson_type || 'text'
    ]);
    
    // Update jumlah pelajaran di tabel kursus
    await client.query(`
      UPDATE courses 
      SET 
        total_lessons = (
          SELECT COUNT(*) FROM lessons l
          JOIN modules m ON l.module_id = m.id
          WHERE m.course_id = $1
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [course_id]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Pelajaran berhasil dibuat',
      lesson: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating lesson:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mengupdate pelajaran
 */
const updateLesson = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { title, content, duration, position, lesson_type } = req.body;
    const teacher_id = req.user.id;
    
    // Validasi input
    if (!title || !content) {
      return res.status(400).json({ message: 'Judul dan konten pelajaran wajib diisi' });
    }
    
    // Cek apakah pelajaran ada dan dimiliki oleh guru yang sedang login
    const lessonCheck = await client.query(`
      SELECT l.*, c.teacher_id 
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = $1
    `, [id]);
    
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pelajaran tidak ditemukan' });
    }
    
    if (lessonCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk mengubah pelajaran ini' });
    }
    
    // Update pelajaran
    const updateQuery = `
      UPDATE lessons
      SET 
        title = $1, 
        content = $2, 
        duration = $3, 
        position = $4, 
        lesson_type = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      title,
      content,
      duration || lessonCheck.rows[0].duration,
      position || lessonCheck.rows[0].position,
      lesson_type || lessonCheck.rows[0].lesson_type,
      id
    ]);
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Pelajaran berhasil diperbarui',
      lesson: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating lesson:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Menghapus pelajaran
 */
const deleteLesson = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const teacher_id = req.user.id;
    
    // Cek apakah pelajaran ada dan dimiliki oleh guru yang sedang login
    const lessonCheck = await client.query(`
      SELECT l.*, c.teacher_id, c.id as course_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = $1
    `, [id]);
    
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pelajaran tidak ditemukan' });
    }
    
    if (lessonCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menghapus pelajaran ini' });
    }
    
    const course_id = lessonCheck.rows[0].course_id;
    
    // Hapus pelajaran
    await client.query('DELETE FROM lessons WHERE id = $1', [id]);
    
    // Update jumlah pelajaran di tabel kursus
    await client.query(`
      UPDATE courses 
      SET 
        total_lessons = (
          SELECT COUNT(*) FROM lessons l
          JOIN modules m ON l.module_id = m.id
          WHERE m.course_id = $1
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [course_id]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Pelajaran berhasil dihapus' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting lesson:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mendapatkan semua modul dan pelajaran dari kursus tertentu
 */
const getCourseContent = async (req, res) => {
  try {
    const { course_id } = req.params;
    
    // Ambil informasi kursus
    const courseQuery = `
      SELECT c.*, cat.name as category_name, 
             u.id as teacher_user_id,
             g.nama_lengkap as teacher_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN guru g ON u.id = g.user_id
      WHERE c.id = $1
    `;
    
    const courseResult = await pool.query(courseQuery, [course_id]);
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Kursus tidak ditemukan' });
    }
    
    // Ambil semua modul untuk kursus ini
    const modulesQuery = `
      SELECT * FROM modules
      WHERE course_id = $1
      ORDER BY position ASC
    `;
    
    const modulesResult = await pool.query(modulesQuery, [course_id]);
    
    // Ambil semua pelajaran untuk modul-modul ini
    const modules = await Promise.all(modulesResult.rows.map(async (module) => {
      const lessonsQuery = `
        SELECT * FROM lessons
        WHERE module_id = $1
        ORDER BY position ASC
      `;
      
      const lessonsResult = await pool.query(lessonsQuery, [module.id]);
      
      return {
        ...module,
        lessons: lessonsResult.rows
      };
    }));
    
    // Jika user adalah siswa, catat akses terakhir
    if (req.user && req.user.role === 'siswa') {
      // Periksa apakah siswa terdaftar di kursus ini
      const enrollmentResult = await pool.query(
        'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
        [course_id, req.user.id]
      );
      
      if (enrollmentResult.rows.length > 0) {
        // Update last_accessed_at
        await pool.query(
          'UPDATE enrollments SET last_accessed_at = CURRENT_TIMESTAMP WHERE course_id = $1 AND student_id = $2',
          [course_id, req.user.id]
        );
      }
    }
    
    res.json({
      message: 'Data konten kursus berhasil diambil',
      course: courseResult.rows[0],
      modules: modules
    });
    
  } catch (error) {
    console.error('Error fetching course content:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Mengupdate kemajuan pelajaran untuk siswa
 */
const updateLessonProgress = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { lesson_id } = req.params;
    const { completed } = req.body;
    const student_id = req.user.id;
    
    // Validasi input
    if (completed === undefined) {
      return res.status(400).json({ message: 'Status completed wajib diisi' });
    }
    
    // Periksa apakah pelajaran ada
    const lessonCheck = await client.query(`
      SELECT l.*, m.course_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE l.id = $1
    `, [lesson_id]);
    
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pelajaran tidak ditemukan' });
    }
    
    const course_id = lessonCheck.rows[0].course_id;
    
    // Periksa apakah siswa terdaftar di kursus ini
    const enrollmentCheck = await client.query(
      'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [course_id, student_id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Anda belum terdaftar di kursus ini' });
    }
    
    // Update atau tambahkan progress pelajaran
    const progressUpsertQuery = `
      INSERT INTO lesson_progress (lesson_id, student_id, completed, last_accessed_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (lesson_id, student_id)
      DO UPDATE SET 
        completed = $3,
        last_accessed_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const progressResult = await client.query(progressUpsertQuery, [
      lesson_id,
      student_id,
      completed
    ]);
    
    // Update last_accessed_at di tabel enrollments
    await client.query(
      'UPDATE enrollments SET last_accessed_at = CURRENT_TIMESTAMP WHERE course_id = $1 AND student_id = $2',
      [course_id, student_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Kemajuan pelajaran berhasil diperbarui',
      progress: progressResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating lesson progress:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mendapatkan kemajuan siswa dalam kursus
 */
const getStudentCourseProgress = async (req, res) => {
  try {
    const { course_id } = req.params;
    const student_id = req.user.id;
    
    // Periksa apakah siswa terdaftar di kursus ini
    const enrollmentCheck = await pool.query(
      'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [course_id, student_id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Anda belum terdaftar di kursus ini' });
    }
    
    // Ambil semua progress pelajaran siswa untuk kursus ini
    const progressQuery = `
      SELECT lp.*, l.title as lesson_title, m.title as module_title, m.id as module_id
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1 AND lp.student_id = $2
    `;
    
    const progressResult = await pool.query(progressQuery, [course_id, student_id]);
    
    // Hitung statistik progress
    const totalLessonsQuery = `
      SELECT COUNT(*) as total
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1
    `;
    
    const completedLessonsQuery = `
      SELECT COUNT(*) as completed
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1 AND lp.student_id = $2 AND lp.completed = true
    `;
    
    const totalResult = await pool.query(totalLessonsQuery, [course_id]);
    const completedResult = await pool.query(completedLessonsQuery, [course_id, student_id]);
    
    const totalLessons = parseInt(totalResult.rows[0].total);
    const completedLessons = parseInt(completedResult.rows[0].completed);
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    res.json({
      message: 'Data kemajuan kursus berhasil diambil',
      progress: progressResult.rows,
      stats: {
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percentage: progressPercentage
      }
    });
    
  } catch (error) {
    console.error('Error fetching student course progress:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = {
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  getCourseContent,
  updateLessonProgress,
  getStudentCourseProgress
};