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
 * Membuat quiz baru untuk pelajaran
 */
const createQuiz = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { lesson_id, title, description, questions, passing_percentage } = req.body;
    const teacher_id = req.user.id;
    
    // Validasi input
    if (!lesson_id || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        message: 'ID pelajaran, judul, dan array pertanyaan wajib diisi' 
      });
    }
    
    // Cek apakah pelajaran ada dan dimiliki oleh guru yang sedang login
    const lessonCheck = await client.query(`
      SELECT l.*, c.teacher_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = $1
    `, [lesson_id]);
    
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pelajaran tidak ditemukan' });
    }
    
    if (lessonCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses untuk menambah quiz di pelajaran ini' 
      });
    }
    
    // Insert quiz baru
    const insertQuizQuery = `
      INSERT INTO quizzes (lesson_id, title, description, passing_percentage)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const quizResult = await client.query(insertQuizQuery, [
      lesson_id,
      title,
      description || '',
      passing_percentage || 70
    ]);
    
    const quiz_id = quizResult.rows[0].id;
    
    // Insert semua pertanyaan quiz
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.question_text || !question.options || !Array.isArray(question.options) || question.options.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: `Pertanyaan #${i+1} tidak valid. Teks pertanyaan dan array opsi wajib diisi` 
        });
      }
      
      // Insert pertanyaan
      const insertQuestionQuery = `
        INSERT INTO quiz_questions (quiz_id, question_text, question_type, position)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      const questionResult = await client.query(insertQuestionQuery, [
        quiz_id,
        question.question_text,
        question.question_type || 'multiple_choice',
        i + 1
      ]);
      
      const question_id = questionResult.rows[0].id;
      
      // Insert semua opsi jawaban
      for (let j = 0; j < question.options.length; j++) {
        const option = question.options[j];
        
        if (!option.option_text) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: `Opsi #${j+1} untuk pertanyaan #${i+1} tidak valid. Teks opsi wajib diisi` 
          });
        }
        
        const insertOptionQuery = `
          INSERT INTO quiz_options (question_id, option_text, is_correct, position)
          VALUES ($1, $2, $3, $4)
        `;
        
        await client.query(insertOptionQuery, [
          question_id,
          option.option_text,
          option.is_correct || false,
          j + 1
        ]);
      }
    }
    
    // Update link ke quiz di tabel lessons
    await client.query(
      'UPDATE lessons SET has_quiz = true WHERE id = $1',
      [lesson_id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Quiz berhasil dibuat',
      quiz: {
        ...quizResult.rows[0],
        questions: questions
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mengupdate quiz
 */
const updateQuiz = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { title, description, questions, passing_percentage } = req.body;
    const teacher_id = req.user.id;
    
    // Validasi input
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        message: 'Judul dan array pertanyaan wajib diisi' 
      });
    }
    
    // Cek apakah quiz ada dan dimiliki oleh guru yang sedang login
    const quizCheck = await client.query(`
      SELECT q.*, c.teacher_id
      FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE q.id = $1
    `, [id]);
    
    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan' });
    }
    
    if (quizCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses untuk mengubah quiz ini' 
      });
    }
    
    // Update quiz
    const updateQuizQuery = `
      UPDATE quizzes
      SET title = $1, description = $2, passing_percentage = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const quizResult = await client.query(updateQuizQuery, [
      title,
      description || quizCheck.rows[0].description,
      passing_percentage || quizCheck.rows[0].passing_percentage,
      id
    ]);
    
    // Hapus semua pertanyaan dan opsi yang ada
    await client.query(
      'DELETE FROM quiz_questions WHERE quiz_id = $1',
      [id]
    );
    
    // Insert semua pertanyaan quiz yang baru
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.question_text || !question.options || !Array.isArray(question.options) || question.options.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: `Pertanyaan #${i+1} tidak valid. Teks pertanyaan dan array opsi wajib diisi` 
        });
      }
      
      // Insert pertanyaan
      const insertQuestionQuery = `
        INSERT INTO quiz_questions (quiz_id, question_text, question_type, position)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      const questionResult = await client.query(insertQuestionQuery, [
        id,
        question.question_text,
        question.question_type || 'multiple_choice',
        i + 1
      ]);
      
      const question_id = questionResult.rows[0].id;
      
      // Insert semua opsi jawaban
      for (let j = 0; j < question.options.length; j++) {
        const option = question.options[j];
        
        if (!option.option_text) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: `Opsi #${j+1} untuk pertanyaan #${i+1} tidak valid. Teks opsi wajib diisi` 
          });
        }
        
        const insertOptionQuery = `
          INSERT INTO quiz_options (question_id, option_text, is_correct, position)
          VALUES ($1, $2, $3, $4)
        `;
        
        await client.query(insertOptionQuery, [
          question_id,
          option.option_text,
          option.is_correct || false,
          j + 1
        ]);
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Quiz berhasil diperbarui',
      quiz: {
        ...quizResult.rows[0],
        questions: questions
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating quiz:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Menghapus quiz
 */
const deleteQuiz = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const teacher_id = req.user.id;
    
    // Cek apakah quiz ada dan dimiliki oleh guru yang sedang login
    const quizCheck = await client.query(`
      SELECT q.*, l.id as lesson_id, c.teacher_id
      FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE q.id = $1
    `, [id]);
    
    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan' });
    }
    
    if (quizCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses untuk menghapus quiz ini' 
      });
    }
    
    const lesson_id = quizCheck.rows[0].lesson_id;
    
    // Hapus quiz (cascade akan menghapus semua pertanyaan dan opsi)
    await client.query('DELETE FROM quizzes WHERE id = $1', [id]);
    
    // Update has_quiz di tabel lessons jika tidak ada quiz lain untuk pelajaran ini
    const otherQuizCheck = await client.query(
      'SELECT * FROM quizzes WHERE lesson_id = $1',
      [lesson_id]
    );
    
    if (otherQuizCheck.rows.length === 0) {
      await client.query(
        'UPDATE lessons SET has_quiz = false WHERE id = $1',
        [lesson_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({ message: 'Quiz berhasil dihapus' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mendapatkan detail quiz (untuk guru)
 */
const getQuizDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher_id = req.user.id;
    
    // Query untuk mendapatkan informasi quiz
    const quizQuery = `
      SELECT q.*, c.teacher_id
      FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE q.id = $1
    `;
    
    const quizResult = await pool.query(quizQuery, [id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan' });
    }
    
    // Jika user bukan guru yang membuat quiz
    if (req.user.role === 'guru' && quizResult.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses untuk melihat quiz ini' 
      });
    }
    
    const quiz = quizResult.rows[0];
    
    // Query untuk mendapatkan semua pertanyaan quiz
    const questionsQuery = `
      SELECT * FROM quiz_questions
      WHERE quiz_id = $1
      ORDER BY position ASC
    `;
    
    const questionsResult = await pool.query(questionsQuery, [id]);
    
    // Ambil semua opsi untuk setiap pertanyaan
    const questions = await Promise.all(questionsResult.rows.map(async (question) => {
      const optionsQuery = `
        SELECT * FROM quiz_options
        WHERE question_id = $1
        ORDER BY position ASC
      `;
      
      const optionsResult = await pool.query(optionsQuery, [question.id]);
      
      return {
        ...question,
        options: optionsResult.rows
      };
    }));
    
    res.json({
      message: 'Detail quiz berhasil diambil',
      quiz: {
        ...quiz,
        questions: questions
      }
    });
    
  } catch (error) {
    console.error('Error fetching quiz detail:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Mendapatkan quiz untuk siswa (tanpa jawaban benar)
 */
const getStudentQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.user.id;
    
    // Query untuk mendapatkan informasi quiz
    const quizQuery = `
      SELECT q.id, q.title, q.description, q.passing_percentage,
             l.id as lesson_id, m.id as module_id, c.id as course_id
      FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE q.id = $1
    `;
    
    const quizResult = await pool.query(quizQuery, [id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan' });
    }
    
    const quiz = quizResult.rows[0];
    
    // Periksa apakah siswa terdaftar di kursus ini
    const enrollmentCheck = await pool.query(
      'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [quiz.course_id, student_id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Anda belum terdaftar di kursus ini' });
    }
    
    // Periksa apakah siswa sudah pernah mengambil quiz ini
    const attemptCheck = await pool.query(
      'SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 AND is_passed = true',
      [id, student_id]
    );
    
    const hasPassedAttempt = attemptCheck.rows.length > 0;
    
    // Query untuk mendapatkan semua pertanyaan quiz
    const questionsQuery = `
      SELECT id, question_text, question_type, position 
      FROM quiz_questions
      WHERE quiz_id = $1
      ORDER BY position ASC
    `;
    
    const questionsResult = await pool.query(questionsQuery, [id]);
    
    // Ambil semua opsi untuk setiap pertanyaan (tanpa menunjukkan jawaban benar)
    const questions = await Promise.all(questionsResult.rows.map(async (question) => {
      const optionsQuery = `
        SELECT id, option_text, position 
        FROM quiz_options
        WHERE question_id = $1
        ORDER BY position ASC
      `;
      
      const optionsResult = await pool.query(optionsQuery, [question.id]);
      
      return {
        ...question,
        options: optionsResult.rows
      };
    }));
    
    res.json({
      message: 'Quiz berhasil diambil',
      quiz: {
        ...quiz,
        questions: questions,
        has_passed: hasPassedAttempt
      }
    });
    
  } catch (error) {
    console.error('Error fetching student quiz:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Mengirimkan jawaban quiz dari siswa
 */
const submitQuizAnswers = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { answers } = req.body;
    const student_id = req.user.id;
    
    // Validasi input
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Array jawaban wajib diisi' });
    }
    
    // Query untuk mendapatkan informasi quiz
    const quizQuery = `
      SELECT q.*, l.id as lesson_id, m.id as module_id, c.id as course_id
      FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE q.id = $1
    `;
    
    const quizResult = await pool.query(quizQuery, [id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan' });
    }
    
    const quiz = quizResult.rows[0];
    
    // Periksa apakah siswa terdaftar di kursus ini
    const enrollmentCheck = await pool.query(
      'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [quiz.course_id, student_id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Anda belum terdaftar di kursus ini' });
    }
    
    // Ambil semua pertanyaan dan opsi jawaban benar
    const questionsQuery = `
      SELECT q.id as question_id, 
             (SELECT array_agg(o.id) FROM quiz_options o WHERE o.question_id = q.id AND o.is_correct = true) as correct_option_ids
      FROM quiz_questions q
      WHERE q.quiz_id = $1
    `;
    
    const questionsResult = await pool.query(questionsQuery, [id]);
    
    if (questionsResult.rows.length === 0) {
      return res.status(400).json({ message: 'Quiz ini tidak memiliki pertanyaan' });
    }
    
    // Buat map pertanyaan dan jawaban benar
    const questionMap = {};
    questionsResult.rows.forEach(q => {
      questionMap[q.question_id] = q.correct_option_ids || [];
    });
    
    // Hitung skor
    let correctCount = 0;
    const answerDetails = [];
    
    for (const answer of answers) {
      const { question_id, selected_option_ids } = answer;
      
      if (!questionMap[question_id]) {
        continue; // Skip jika pertanyaan tidak ada dalam quiz
      }
      
      // Bandingkan jawaban siswa dengan jawaban benar
      const correctOptions = questionMap[question_id];
      let isCorrect = false;
      
      if (Array.isArray(selected_option_ids) && Array.isArray(correctOptions)) {
        // Cek apakah semua jawaban benar dipilih dan tidak ada jawaban salah yang dipilih
        const allCorrectSelected = correctOptions.every(id => selected_option_ids.includes(id));
        const noIncorrectSelected = selected_option_ids.every(id => correctOptions.includes(id));
        
        isCorrect = allCorrectSelected && noIncorrectSelected;
      }
      
      if (isCorrect) {
        correctCount++;
      }
      
      answerDetails.push({
        question_id,
        selected_option_ids: selected_option_ids || [],
        is_correct: isCorrect
      });
    }
    
    // Hitung persentase jawaban benar
    const totalQuestions = questionsResult.rows.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = scorePercentage >= quiz.passing_percentage;
    
    // Simpan hasil ujian
    const insertAttemptQuery = `
      INSERT INTO quiz_attempts (
        quiz_id, student_id, score_percentage, is_passed, completed_at
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    const attemptResult = await client.query(insertAttemptQuery, [
      id,
      student_id,
      scorePercentage,
      isPassed
    ]);
    
    const attempt_id = attemptResult.rows[0].id;
    
    // Simpan detail jawaban
    for (const detail of answerDetails) {
      const insertDetailQuery = `
        INSERT INTO quiz_attempt_answers (
          attempt_id, question_id, selected_option_ids, is_correct
        )
        VALUES ($1, $2, $3, $4)
      `;
      
      await client.query(insertDetailQuery, [
        attempt_id,
        detail.question_id,
        detail.selected_option_ids,
        detail.is_correct
      ]);
    }
    
    // Jika siswa lulus quiz, update lesson progress
    if (isPassed) {
      const progressUpsertQuery = `
        INSERT INTO lesson_progress (lesson_id, student_id, completed, last_accessed_at)
        VALUES ($1, $2, true, CURRENT_TIMESTAMP)
        ON CONFLICT (lesson_id, student_id)
        DO UPDATE SET 
          completed = true,
          last_accessed_at = CURRENT_TIMESTAMP
      `;
      
      await client.query(progressUpsertQuery, [quiz.lesson_id, student_id]);
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: isPassed ? 'Selamat! Anda lulus quiz ini' : 'Anda belum lulus quiz ini',
      result: {
        score_percentage: scorePercentage,
        is_passed: isPassed,
        correct_count: correctCount,
        total_questions: totalQuestions,
        passing_percentage: quiz.passing_percentage,
        answers: answerDetails
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting quiz answers:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mendapatkan hasil quiz untuk siswa
 */
const getStudentQuizResults = async (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.user.id;
    
    // Query untuk mendapatkan informasi quiz
    const quizQuery = `
      SELECT q.id, q.title, q.passing_percentage,
             l.id as lesson_id, m.id as module_id, c.id as course_id
      FROM quizzes q
      JOIN lessons l ON q.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE q.id = $1
    `;
    
    const quizResult = await pool.query(quizQuery, [id]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan' });
    }
    
    const quiz = quizResult.rows[0];
    
    // Periksa apakah siswa terdaftar di kursus ini
    const enrollmentCheck = await pool.query(
      'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2',
      [quiz.course_id, student_id]
    );
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Anda belum terdaftar di kursus ini' });
    }
    
    // Ambil semua upaya pengerjaan quiz oleh siswa
    const attemptsQuery = `
      SELECT id, score_percentage, is_passed, completed_at
      FROM quiz_attempts
      WHERE quiz_id = $1 AND student_id = $2
      ORDER BY completed_at DESC
    `;
    
    const attemptsResult = await pool.query(attemptsQuery, [id, student_id]);
    
    // Jika tidak ada upaya, kembalikan pesan
    if (attemptsResult.rows.length === 0) {
      return res.json({
        message: 'Anda belum pernah mengerjakan quiz ini',
        quiz: {
          id: quiz.id,
          title: quiz.title,
          passing_percentage: quiz.passing_percentage
        },
        attempts: []
      });
    }
    
    // Ambil detail jawaban untuk upaya terakhir
    const lastAttempt = attemptsResult.rows[0];
    const answersQuery = `
      SELECT a.*, q.question_text,
             array(
               SELECT json_build_object('id', o.id, 'option_text', o.option_text, 'is_correct', o.is_correct)
               FROM quiz_options o
               WHERE o.question_id = a.question_id
               ORDER BY o.position
             ) as options
      FROM quiz_attempt_answers a
      JOIN quiz_questions q ON a.question_id = q.id
      WHERE a.attempt_id = $1
      ORDER BY q.position
    `;
    
    const answersResult = await pool.query(answersQuery, [lastAttempt.id]);
    
    res.json({
      message: 'Hasil quiz berhasil diambil',
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passing_percentage: quiz.passing_percentage
      },
      attempts: attemptsResult.rows,
      last_attempt_details: {
        ...lastAttempt,
        answers: answersResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

/**
 * Membuat tugas (assignment) baru
 */
const createAssignment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { lesson_id, title, description, instructions, deadline, max_score } = req.body;
    const teacher_id = req.user.id;
    
    // Validasi input
    if (!lesson_id || !title || !description || !instructions) {
      return res.status(400).json({ 
        message: 'ID pelajaran, judul, deskripsi, dan instruksi wajib diisi' 
      });
    }
    
    // Cek apakah pelajaran ada dan dimiliki oleh guru yang sedang login
    const lessonCheck = await client.query(`
      SELECT l.*, c.teacher_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE l.id = $1
    `, [lesson_id]);
    
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pelajaran tidak ditemukan' });
    }
    
    if (lessonCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses untuk menambah tugas di pelajaran ini' 
      });
    }
    
    // Insert tugas baru
    const insertQuery = `
      INSERT INTO assignments (
        lesson_id, title, description, instructions, deadline, max_score
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      lesson_id,
      title,
      description,
      instructions,
      deadline ? new Date(deadline) : null,
      max_score || 100
    ];
    
    const result = await client.query(insertQuery, values);
    
    // Update has_assignment di tabel lessons
    await client.query(
      'UPDATE lessons SET has_assignment = true WHERE id = $1',
      [lesson_id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Tugas berhasil dibuat',
      assignment: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Mengupdate tugas
 */
const updateAssignment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { title, description, instructions, deadline, max_score } = req.body;
    const teacher_id = req.user.id;
    
    // Validasi input
    if (!title || !description || !instructions) {
      return res.status(400).json({ 
        message: 'Judul, deskripsi, dan instruksi wajib diisi' 
      });
    }
    
    // Cek apakah tugas ada dan dimiliki oleh guru yang sedang login
    const assignmentCheck = await client.query(`
      SELECT a.*, c.teacher_id
      FROM assignments a
      JOIN lessons l ON a.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE a.id = $1
    `, [id]);
    
    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }
    
    if (assignmentCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses untuk mengubah tugas ini' 
      });
    }
    
    // Update tugas
    const updateQuery = `
      UPDATE assignments
      SET 
        title = $1,
        description = $2,
        instructions = $3,
        deadline = $4,
        max_score = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    
    const values = [
      title,
      description,
      instructions,
      deadline ? new Date(deadline) : assignmentCheck.rows[0].deadline,
      max_score || assignmentCheck.rows[0].max_score,
      id
    ];
    
    const result = await client.query(updateQuery, values);
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Tugas berhasil diperbarui',
      assignment: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Menghapus tugas
 */
const deleteAssignment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const teacher_id = req.user.id;
    
    // Cek apakah tugas ada dan dimiliki oleh guru yang sedang login
    const assignmentCheck = await client.query(`
      SELECT a.*, l.id as lesson_id, c.teacher_id
      FROM assignments a
      JOIN lessons l ON a.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE a.id = $1
    `, [id]);
    
    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }
    
    if (assignmentCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses untuk menghapus tugas ini' 
      });
    }
    
    const lesson_id = assignmentCheck.rows[0].lesson_id;
    
    // Hapus tugas
    await client.query('DELETE FROM assignments WHERE id = $1', [id]);
    
    // Update has_assignment di tabel lessons jika tidak ada tugas lain
    const otherAssignmentCheck = await client.query(
      'SELECT * FROM assignments WHERE lesson_id = $1',
      [lesson_id]
    );
    
    if (otherAssignmentCheck.rows.length === 0) {
      await client.query(
        'UPDATE lessons SET has_assignment = false WHERE id = $1',
        [lesson_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({ message: 'Tugas berhasil dihapus' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

/**
 * Melihat daftar pengumpulan tugas (untuk guru)
 */
const getAssignmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher_id = req.user.id;
    
    // Cek apakah tugas ada dan dimiliki oleh guru yang sedang login
    const assignmentCheck = await client.query(`
      SELECT a.*, c.teacher_id, c.id as course_id
      FROM assignments a
      JOIN lessons l ON a.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE a.id = $1
    `, [id]);
    
    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }
    
    if (assignmentCheck.rows[0].teacher_id !== teacher_id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki akses untuk melihat pengumpulan tugas ini' 
      });
    }
    
    // Ambil daftar siswa yang terdaftar di kursus
    const studentsQuery = `
      SELECT e.student_id, s.nama_lengkap, s.nis
      FROM enrollments e
      JOIN siswa s ON e.student_id = s.user_id
      WHERE e.course_id = $1
    `;
    
    const studentsResult = await pool.query(studentsQuery, [assignmentCheck.rows[0].course_id]);
    
    // Ambil pengumpulan tugas untuk setiap siswa
    const submissions = await Promise.all(studentsResult.rows.map(async (student) => {
      const submissionQuery = `
        SELECT * FROM assignment_submissions
        WHERE assignment_id = $1 AND student_id = $2
        ORDER BY submitted_at DESC
        LIMIT 1
      `;
      
      const submissionResult = await pool.query(submissionQuery, [id, student.student_id]);
      
      return {
        student_id: student.student_id,
        nama_lengkap: student.nama_lengkap,
        nis: student.nis,
        submission: submissionResult.rows.length > 0 ? submissionResult.rows[0] : null
      };
    }));
    
    res.json({
      message: 'Daftar pengumpulan tugas berhasil diambil',
      assignment: assignmentCheck.rows[0],
      submissions: submissions
    });
    
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizDetail,
  getStudentQuiz,
  submitQuizAnswers,
  getStudentQuizResults,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions
};