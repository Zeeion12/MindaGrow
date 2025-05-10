exports.getLesson = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From auth middleware
  
  try {
    // Get lesson details
    const lessonResult = await pool.query(`
      SELECT l.*, m.title as module_title, c.id as course_id, c.title as course_title
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = $1
    `, [id]);
    
    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    const lesson = lessonResult.rows[0];
    
    // Get enrollment
    const enrollmentResult = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, lesson.course_id]
    );
    
    if (enrollmentResult.rows.length === 0) {
      // Auto-enroll user
      const newEnrollmentResult = await pool.query(
        'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) RETURNING *',
        [userId, lesson.course_id]
      );
      
      // Create lesson progress records
      const lessonsResult = await pool.query(`
        SELECT l.id 
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        WHERE m.course_id = $1
      `, [lesson.course_id]);
      
      const enrollmentId = newEnrollmentResult.rows[0].id;
      
      for (const lessonItem of lessonsResult.rows) {
        await pool.query(
          'INSERT INTO lesson_progress (enrollment_id, lesson_id) VALUES ($1, $2)',
          [enrollmentId, lessonItem.id]
        );
      }
    }
    
    res.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update lesson progress
exports.updateLessonProgress = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id; // From auth middleware
  
  try {
    // Get lesson course
    const lessonResult = await pool.query(`
      SELECT c.id as course_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = $1
    `, [id]);
    
    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    const courseId = lessonResult.rows[0].course_id;
    
    // Get enrollment
    const enrollmentResult = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    
    if (enrollmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    const enrollmentId = enrollmentResult.rows[0].id;
    
    // Check if lesson progress exists
    const progressResult = await pool.query(
      'SELECT * FROM lesson_progress WHERE enrollment_id = $1 AND lesson_id = $2',
      [enrollmentId, id]
    );
    
    if (progressResult.rows.length === 0) {
      // Create new progress
      await pool.query(
        'INSERT INTO lesson_progress (enrollment_id, lesson_id, status, completed_at) VALUES ($1, $2, $3, $4)',
        [enrollmentId, id, status, status === 'completed' ? new Date() : null]
      );
    } else {
      // Update existing progress
      await pool.query(
        'UPDATE lesson_progress SET status = $1, completed_at = $2, updated_at = CURRENT_TIMESTAMP WHERE enrollment_id = $3 AND lesson_id = $4',
        [status, status === 'completed' ? new Date() : null, enrollmentId, id]
      );
    }
    
    // If lesson is marked as completed, update streak and log activity
    if (status === 'completed') {
      await updateUserStreak(userId);
      
      await pool.query(
        'INSERT INTO activity_logs (user_id, activity_type, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
        [userId, 'lesson_complete', 'lesson', id]
      );
      
      // Update enrollment progress
      await updateCourseProgress(enrollmentId, courseId);
    }
    
    res.json({ message: 'Lesson progress updated' });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};