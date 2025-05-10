const { Pool } = require('pg');
const pool = new Pool({
  // your PostgreSQL connection config
});

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, ct.name as category_name, 
        u.nama_lengkap as teacher_name,
        COUNT(DISTINCT e.id) as enrolled_students
      FROM courses c
      LEFT JOIN categories ct ON c.category_id = ct.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.is_published = true
      GROUP BY c.id, ct.name, u.nama_lengkap
      ORDER BY c.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get popular courses
exports.getPopularCourses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, ct.name as category_name, 
        u.nama_lengkap as teacher_name,
        COUNT(DISTINCT e.id) as enrolled_students
      FROM courses c
      LEFT JOIN categories ct ON c.category_id = ct.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.is_published = true
      GROUP BY c.id, ct.name, u.nama_lengkap
      ORDER BY enrolled_students DESC, c.created_at DESC
      LIMIT 4
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching popular courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get new courses
exports.getNewCourses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, ct.name as category_name, 
        u.nama_lengkap as teacher_name
      FROM courses c
      LEFT JOIN categories ct ON c.category_id = ct.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.is_published = true
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching new courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single course
exports.getCourse = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get course details with teacher info
    const courseResult = await pool.query(`
      SELECT c.*, ct.name as category_name, 
        u.nama_lengkap as teacher_name,
        tp.bio as teacher_bio, tp.expertise as teacher_expertise,
        tp.education as teacher_education, tp.experience as teacher_experience,
        tp.total_courses, tp.total_students, tp.average_rating,
        COUNT(DISTINCT e.id) as enrolled_students,
        AVG(cr.rating) as average_rating,
        COUNT(DISTINCT cr.id) as total_ratings
      FROM courses c
      LEFT JOIN categories ct ON c.category_id = ct.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN course_ratings cr ON c.id = cr.course_id
      WHERE c.id = $1
      GROUP BY c.id, ct.name, u.nama_lengkap, tp.bio, tp.expertise, 
        tp.education, tp.experience, tp.total_courses, tp.total_students, tp.average_rating
    `, [id]);
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const course = courseResult.rows[0];
    
    // Get modules and lessons
    const modulesResult = await pool.query(`
      SELECT m.*, 
        json_agg(json_build_object(
          'id', l.id,
          'title', l.title,
          'duration', l.duration,
          'position', l.position
        ) ORDER BY l.position) as lessons
      FROM modules m
      LEFT JOIN lessons l ON m.id = l.module_id
      WHERE m.course_id = $1
      GROUP BY m.id
      ORDER BY m.position
    `, [id]);
    
    course.modules = modulesResult.rows;
    
    res.json(course);
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get course for learning page
exports.getCourseForLearning = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From auth middleware
  
  try {
    // Check if user is enrolled
    const enrollmentResult = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, id]
    );
    
    if (enrollmentResult.rows.length === 0) {
      // Automatically enroll user
      await pool.query(
        'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)',
        [userId, id]
      );
    }
    
    // Get course details
    const courseResult = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [id]
    );
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const course = courseResult.rows[0];
    
    // Get modules with lessons
    const modulesResult = await pool.query(`
      SELECT m.*, 
        json_agg(json_build_object(
          'id', l.id,
          'title', l.title,
          'duration', l.duration,
          'position', l.position,
          'completed', CASE WHEN lp.status = 'completed' THEN true ELSE false END
        ) ORDER BY l.position) as lessons
      FROM modules m
      LEFT JOIN lessons l ON m.id = l.module_id
      LEFT JOIN enrollments e ON e.course_id = m.course_id AND e.user_id = $1
      LEFT JOIN lesson_progress lp ON lp.enrollment_id = e.id AND lp.lesson_id = l.id
      WHERE m.course_id = $2
      GROUP BY m.id
      ORDER BY m.position
    `, [userId, id]);
    
    res.json({
      course,
      modules: modulesResult.rows
    });
  } catch (error) {
    console.error('Error fetching course for learning:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Enroll in a course
exports.enrollCourse = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From auth middleware
  
  try {
    // Check if already enrolled
    const checkResult = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, id]
    );
    
    if (checkResult.rows.length > 0) {
      return res.json({ message: 'Already enrolled', enrollment: checkResult.rows[0] });
    }
    
    // Create new enrollment
    const result = await pool.query(
      'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [userId, id]
    );
    
    // Create lesson progress records for all lessons in the course
    const lessonsResult = await pool.query(`
      SELECT l.id 
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1
    `, [id]);
    
    const enrollmentId = result.rows[0].id;
    
    for (const lesson of lessonsResult.rows) {
      await pool.query(
        'INSERT INTO lesson_progress (enrollment_id, lesson_id) VALUES ($1, $2)',
        [enrollmentId, lesson.id]
      );
    }
    
    // Update user streak
    await updateUserStreak(userId);
    
    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, activity_type, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
      [userId, 'course_start', 'course', id]
    );
    
    res.status(201).json({ message: 'Successfully enrolled', enrollment: result.rows[0] });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get course progress
exports.getCourseProgress = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From auth middleware
  
  try {
    // Get enrollment
    const enrollmentResult = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, id]
    );
    
    if (enrollmentResult.rows.length === 0) {
      return res.json({ progress: 0 });
    }
    
    const enrollmentId = enrollmentResult.rows[0].id;
    
    // Count total lessons
    const totalLessonsResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1
    `, [id]);
    
    const totalLessons = parseInt(totalLessonsResult.rows[0].total);
    
    if (totalLessons === 0) {
      return res.json({ progress: 100 }); // No lessons means course is complete
    }
    
    // Count completed lessons
    const completedLessonsResult = await pool.query(`
      SELECT COUNT(*) as completed
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1 AND lp.enrollment_id = $2 AND lp.status = 'completed'
    `, [id, enrollmentId]);
    
    const completedLessons = parseInt(completedLessonsResult.rows[0].completed);
    
    // Calculate progress percentage
    const progress = Math.round((completedLessons / totalLessons) * 100);
    
    res.json({ progress });
  } catch (error) {
    console.error('Error getting course progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is enrolled in a course
exports.checkEnrollment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From auth middleware
  
  try {
    const result = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, id]
    );
    
    res.json({ is_enrolled: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking enrollment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's progress on all courses
exports.getUserProgress = async (req, res) => {
  const userId = req.user.id; // From auth middleware
  
  try {
    const result = await pool.query(`
      SELECT e.course_id, e.progress, c.title as course_title, ct.name as category_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN categories ct ON c.category_id = ct.id
      WHERE e.user_id = $1
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};