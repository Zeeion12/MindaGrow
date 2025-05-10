exports.getTeacherProfile = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT u.id, u.nama_lengkap as name, 
        u.email, u.profile_picture,
        tp.bio, tp.expertise, tp.education, tp.experience,
        tp.website, tp.social_media,
        tp.total_courses, tp.total_students, tp.average_rating,
        COUNT(DISTINCT c.id) as course_count
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN courses c ON u.id = c.teacher_id
      WHERE u.id = $1 AND u.role = 'guru'
      GROUP BY u.id, tp.bio, tp.expertise, tp.education, tp.experience,
        tp.website, tp.social_media, tp.total_courses, tp.total_students, tp.average_rating
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    const teacher = result.rows[0];
    
    // Get teacher courses
    const coursesResult = await pool.query(`
      SELECT c.id, c.title, c.short_description, c.banner_image, c.category_id,
        ct.name as category_name, 
        COUNT(DISTINCT e.id) as enrolled_students
      FROM courses c
      LEFT JOIN categories ct ON c.category_id = ct.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.teacher_id = $1 AND c.is_published = true
      GROUP BY c.id, ct.name
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [id]);
    
    teacher.courses = coursesResult.rows;
    
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// File: server/controllers/userController.js
// Get user streak
exports.getUserStreak = async (req, res) => {
  const userId = req.user.id; // From auth middleware
  
  try {
    const result = await pool.query(
      'SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ current_streak: 0, longest_streak: 0 });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user streak:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Utility functions
async function updateUserStreak(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user streak exists
    const streakResult = await pool.query(
      'SELECT * FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    
    if (streakResult.rows.length === 0) {
      // Create new streak
      await pool.query(
        'INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_start_date) VALUES ($1, 1, 1, $2, $2)',
        [userId, today]
      );
      return;
    }
    
    const streak = streakResult.rows[0];
    let lastActivityDate = new Date(streak.last_activity_date);
    lastActivityDate.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastActivityDate.getTime() === today.getTime()) {
      // Already logged activity today, no need to update
      return;
    }
    
    if (lastActivityDate.getTime() === yesterday.getTime()) {
      // Consecutive day, increment streak
      const newStreak = streak.current_streak + 1;
      const longestStreak = Math.max(newStreak, streak.longest_streak);
      
      await pool.query(
        'UPDATE user_streaks SET current_streak = $1, longest_streak = $2, last_activity_date = $3 WHERE user_id = $4',
        [newStreak, longestStreak, today, userId]
      );
    } else {
      // Streak broken, start new streak
      await pool.query(
        'UPDATE user_streaks SET current_streak = 1, last_activity_date = $1, streak_start_date = $1 WHERE user_id = $2',
        [today, userId]
      );
    }
  } catch (error) {
    console.error('Error updating user streak:', error);
  }
}

async function updateCourseProgress(enrollmentId, courseId) {
  try {
    // Count total lessons
    const totalLessonsResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1
    `, [courseId]);
    
    const totalLessons = parseInt(totalLessonsResult.rows[0].total);
    
    if (totalLessons === 0) {
      // No lessons means course is complete
      await pool.query(
        'UPDATE enrollments SET progress = 100, completed_lessons = 0, completion_date = CURRENT_TIMESTAMP WHERE id = $1',
        [enrollmentId]
      );
      return;
    }
    
    // Count completed lessons
    const completedLessonsResult = await pool.query(`
      SELECT COUNT(*) as completed
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = $1 AND lp.enrollment_id = $2 AND lp.status = 'completed'
    `, [courseId, enrollmentId]);
    
    const completedLessons = parseInt(completedLessonsResult.rows[0].completed);
    
    // Calculate progress percentage
    const progress = Math.round((completedLessons / totalLessons) * 100);
    
    // Update enrollment progress
    await pool.query(
      'UPDATE enrollments SET progress = $1, completed_lessons = $2, last_accessed_at = CURRENT_TIMESTAMP WHERE id = $3',
      [progress, completedLessons, enrollmentId]
    );
    
    // If all lessons are completed, update completion date
    if (progress === 100) {
      await pool.query(
        'UPDATE enrollments SET completion_date = CURRENT_TIMESTAMP WHERE id = $1',
        [enrollmentId]
      );
    }
  } catch (error) {
    console.error('Error updating course progress:', error);
  }
}