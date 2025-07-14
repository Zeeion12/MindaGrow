// Buat file baru: server/routes/lessons.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// POST /api/lessons/:id/progress - Update lesson progress
router.post('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const { id: userId, role } = req.user;
    const { completed = false, started = true } = req.body;
    
    if (role !== 'siswa') {
      return res.status(403).json({
        success: false,
        message: 'Only students can update lesson progress'
      });
    }
    
    // Periksa apakah lesson exists dan user enrolled
    const lessonCheck = await pool.query(`
      SELECT l.*, m.course_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE l.id = $1
    `, [lessonId]);
    
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }
    
    const lesson = lessonCheck.rows[0];
    
    // Periksa enrollment
    const enrollmentCheck = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = $3',
      [userId, lesson.course_id, 'active']
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }
    
    // Update atau insert progress
    const upsertQuery = `
      INSERT INTO lesson_progress (lesson_id, user_id, completed, last_accessed_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (lesson_id, user_id)
      DO UPDATE SET 
        completed = $3,
        last_accessed_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(upsertQuery, [lessonId, userId, completed]);
    
    // Update enrollment last_accessed_at
    await pool.query(
      'UPDATE enrollments SET last_accessed_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND course_id = $2',
      [userId, lesson.course_id]
    );
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      progress: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
});

// GET /api/lessons/:id - Get lesson content
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const { id: userId, role } = req.user;
    
    // Ambil lesson dengan course info
    const lessonQuery = `
      SELECT l.*, m.title as module_title, m.course_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE l.id = $1
    `;
    
    const lessonResult = await pool.query(lessonQuery, [lessonId]);
    
    if (lessonResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }
    
    const lesson = lessonResult.rows[0];
    
    // Periksa enrollment untuk siswa
    if (role === 'siswa') {
      const enrollmentCheck = await pool.query(
        'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = $3',
        [userId, lesson.course_id, 'active']
      );
      
      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this course'
        });
      }
    }
    
    res.json({
      success: true,
      data: lesson
    });
    
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lesson',
      error: error.message
    });
  }
});

module.exports = router;