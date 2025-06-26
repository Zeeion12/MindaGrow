// server/services/courseService.js
const { Pool } = require('pg');

// Use existing pool configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

const courseService = {
  // Get all courses with filters
  getAllCourses: async (page, limit, filters) => {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE c.status = $1';
      const queryParams = ['active'];
      let paramCount = 1;

      // Add filters
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
          cat.name as category_name,
          COALESCE(
            CASE 
              WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
              WHEN c.instructor_role = 'admin' THEN 'Administrator'
              ELSE 'Unknown'
            END, 'Unknown'
          ) as instructor_name,
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
      throw new Error(`Error fetching courses: ${error.message}`);
    }
  },

  // Get course by ID with full details
  getCourseById: async (courseId, userId = null) => {
    try {
      let query = `
        SELECT 
          c.*,
          cat.name as category_name,
          COALESCE(
            CASE 
              WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
              WHEN c.instructor_role = 'admin' THEN 'Administrator'
              ELSE 'Unknown'
            END, 'Unknown'
          ) as instructor_name,
          COALESCE(
            CASE 
              WHEN c.instructor_role = 'guru' THEN u.email
              WHEN c.instructor_role = 'admin' THEN u.email
              ELSE null
            END
          ) as instructor_email,
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
        LEFT JOIN users u ON c.instructor_id = u.id
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
        GROUP BY c.id, cat.name, g.nama_lengkap, u.email
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
      const modulesQuery = `
        SELECT id, title, description, duration, order_index
        FROM modules
        WHERE course_id = $1
        ORDER BY order_index ASC
      `;

      const modulesResult = await pool.query(modulesQuery, [courseId]);
      course.modules = modulesResult.rows;

      // Get recent reviews
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

      return course;
    } catch (error) {
      throw new Error(`Error fetching course: ${error.message}`);
    }
  },

  // Get popular courses
  getPopularCourses: async (limit) => {
    try {
      const query = `
        SELECT 
          c.id,
          c.title,
          c.description,
          c.thumbnail,
          c.price,
          c.level,
          cat.name as category_name,
          COALESCE(
            CASE 
              WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
              WHEN c.instructor_role = 'admin' THEN 'Administrator'
              ELSE 'Unknown'
            END, 'Unknown'
          ) as instructor_name,
          COUNT(DISTINCT e.id) as enrolled_count,
          AVG(cr.rating) as average_rating
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN course_ratings cr ON c.id = cr.course_id
        WHERE c.status = 'active'
        GROUP BY c.id, cat.name, g.nama_lengkap
        ORDER BY enrolled_count DESC, average_rating DESC NULLS LAST
        LIMIT $1
      `;

      const result = await pool.query(query, [parseInt(limit)]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching popular courses: ${error.message}`);
    }
  },

  // Get new courses
  getNewCourses: async (limit) => {
    try {
      const query = `
        SELECT 
          c.id,
          c.title,
          c.description,
          c.thumbnail,
          c.price,
          c.level,
          c.created_at,
          cat.name as category_name,
          COALESCE(
            CASE 
              WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
              WHEN c.instructor_role = 'admin' THEN 'Administrator'
              ELSE 'Unknown'
            END, 'Unknown'
          ) as instructor_name,
          COUNT(DISTINCT e.id) as enrolled_count
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.status = 'active'
        GROUP BY c.id, cat.name, g.nama_lengkap
        ORDER BY c.created_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [parseInt(limit)]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching new courses: ${error.message}`);
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
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  },

  // Create new course
  createCourse: async (courseData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        title,
        description,
        category_id,
        level,
        price,
        duration,
        thumbnail,
        instructor_id,
        created_by
      } = courseData;

      // Get instructor role
      const userResult = await client.query('SELECT role FROM users WHERE id = $1', [instructor_id]);
      const instructorRole = userResult.rows[0]?.role || 'guru';

      const query = `
        INSERT INTO courses (
          title, description, category_id, level, price, 
          duration, thumbnail, instructor_id, instructor_role, created_by, 
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW())
        RETURNING id
      `;

      const result = await client.query(query, [
        title, description, category_id, level, price,
        duration, thumbnail, instructor_id, instructorRole, created_by
      ]);

      await client.query('COMMIT');

      return await courseService.getCourseById(result.rows[0].id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error creating course: ${error.message}`);
    } finally {
      client.release();
    }
  },

  // Update course
  updateCourse: async (courseId, updateData) => {
    try {
      const fields = [];
      const values = [];
      let paramCount = 0;

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          paramCount++;
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      paramCount++;
      fields.push(`updated_at = NOW()`);
      values.push(courseId);

      const query = `UPDATE courses SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id`;
      await pool.query(query, values);

      return await courseService.getCourseById(courseId);
    } catch (error) {
      throw new Error(`Error updating course: ${error.message}`);
    }
  },

  // Delete course
  deleteCourse: async (courseId) => {
    try {
      // Soft delete - update status instead of actual deletion
      const query = 'UPDATE courses SET status = $1, updated_at = NOW() WHERE id = $2';
      await pool.query(query, ['deleted', courseId]);
    } catch (error) {
      throw new Error(`Error deleting course: ${error.message}`);
    }
  },

  // Enroll in course
  enrollCourse: async (userId, courseId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if already enrolled
      const checkQuery = 'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2';
      const existing = await client.query(checkQuery, [userId, courseId]);

      if (existing.rows.length > 0) {
        throw new Error('Already enrolled');
      }

      // Create enrollment
      const query = `
        INSERT INTO enrollments (user_id, course_id, enrolled_at, status)
        VALUES ($1, $2, NOW(), 'active')
        RETURNING id
      `;

      const result = await client.query(query, [userId, courseId]);
      
      await client.query('COMMIT');
      
      return { id: result.rows[0].id, user_id: userId, course_id: courseId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Unenroll from course
  unenrollCourse: async (userId, courseId) => {
    try {
      const query = 'DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2';
      await pool.query(query, [userId, courseId]);
    } catch (error) {
      throw new Error(`Error unenrolling from course: ${error.message}`);
    }
  },

  // Get enrolled courses for student
  getEnrolledCourses: async (userId) => {
    try {
      const query = `
        SELECT 
          c.*,
          cat.name as category_name,
          COALESCE(
            CASE 
              WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
              WHEN c.instructor_role = 'admin' THEN 'Administrator'
              ELSE 'Unknown'
            END, 'Unknown'
          ) as instructor_name,
          e.enrolled_at,
          e.status as enrollment_status,
          COALESCE(lp.progress_percentage, 0) as progress_percentage
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
        LEFT JOIN (
          SELECT 
            course_id,
            user_id,
            (COUNT(DISTINCT module_id) * 100.0 / 
             NULLIF((SELECT COUNT(*) FROM modules WHERE course_id = lp.course_id), 0)) as progress_percentage
          FROM lesson_progress lp
          WHERE user_id = $1
          GROUP BY course_id, user_id
        ) lp ON c.id = lp.course_id
        WHERE e.user_id = $1 AND e.status = 'active' AND c.status = 'active'
        ORDER BY e.enrolled_at DESC
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching enrolled courses: ${error.message}`);
    }
  },

  // Get created courses for instructor
  getCreatedCourses: async (instructorId) => {
    try {
      const query = `
        SELECT 
          c.*,
          cat.name as category_name,
          COUNT(DISTINCT e.id) as enrolled_count,
          AVG(cr.rating) as average_rating,
          COUNT(DISTINCT cr.id) as review_count
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN course_ratings cr ON c.id = cr.course_id
        WHERE c.instructor_id = $1 AND c.status != 'deleted'
        GROUP BY c.id, cat.name
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query, [instructorId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching created courses: ${error.message}`);
    }
  }
};

module.exports = courseService;