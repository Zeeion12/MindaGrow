const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'mindagrow',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

// Helper function untuk menghitung ukuran file
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Submit assignment by student - FIXED VERSION
exports.submitAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const { comment } = req.body; // comment berisi jawaban/komentar siswa
    const studentId = req.user.id;

    try {
        // Check assignment exists and student has access
        const assignmentCheck = await pool.query(`
            SELECT a.*, c.name as class_name
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            JOIN class_members cm ON c.id = cm.class_id
            WHERE a.id = $1 AND cm.user_id = $2 AND a.status = 'active'
        `, [assignmentId, studentId]);

        if (assignmentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tugas tidak ditemukan atau Anda tidak memiliki akses.'
            });
        }

        // Check if already submitted
        const existingSubmission = await pool.query(
            'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
            [assignmentId, studentId]
        );

        if (existingSubmission.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Anda sudah mengumpulkan tugas ini.'
            });
        }

        // Handle file upload
        let fileUrl = null;
        let fileSize = null;
        let fileName = null;

        if (req.file) {
            fileUrl = `uploads/submissions/${req.file.filename}`;
            fileSize = formatFileSize(req.file.size);
            fileName = req.file.originalname;
        }

        // Validation
        if (!comment || comment.trim() === '') {
            // Delete uploaded file if validation fails
            if (req.file && req.file.path) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting uploaded file:', unlinkError);
                }
            }
            return res.status(400).json({
                success: false,
                message: 'Komentar/jawaban wajib diisi.'
            });
        }

        // Insert submission dengan data yang benar
        const result = await pool.query(
            `INSERT INTO submissions (
            assignment_id, student_id, comment, file_url, file_size, status, 
            submitted_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING *`,
            [
                assignmentId,
                studentId,
                comment.trim(), // Pastikan comment tidak kosong dan sudah di-trim
                fileUrl,
                fileSize,
                'submitted'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Tugas berhasil dikumpulkan',
            submission: result.rows[0]
        });

    } catch (error) {
        console.error('Error submitting assignment:', error);

        // Delete uploaded file if error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengumpulkan tugas.'
        });
    }
};

// Get submissions by assignment (untuk guru melihat semua submission)
exports.getSubmissionsByAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const teacherId = req.user.id;

    try {
        // Verify teacher has access to this assignment
        const assignmentCheck = await pool.query(`
            SELECT a.*, c.name as class_name
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            WHERE a.id = $1 AND a.teacher_id = $2
        `, [assignmentId, teacherId]);

        if (assignmentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tugas tidak ditemukan atau Anda tidak memiliki akses.'
            });
        }

        // Get all submissions for this assignment dengan informasi lebih lengkap
        const submissions = await pool.query(`
            SELECT 
                s.*,
                siswa.nama_lengkap as student_name,
                siswa.nis as student_nis,
                users.email as student_email,
                CASE 
                    WHEN s.submitted_at IS NULL THEN 'not_submitted'
                    WHEN s.score IS NULL THEN 'pending_grading'
                    ELSE s.status
                END as current_status
            FROM submissions s
            JOIN users ON s.student_id = users.id
            JOIN siswa ON users.id = siswa.user_id
            WHERE s.assignment_id = $1
            ORDER BY s.submitted_at DESC
        `, [assignmentId]);

        res.json({
            success: true,
            assignment: assignmentCheck.rows[0],
            submissions: submissions.rows
        });

    } catch (error) {
        console.error('Error getting submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server.'
        });
    }
};

// Download submission file
exports.downloadSubmissionFile = async (req, res) => {
    const { submissionId } = req.params;
    const userId = req.user.id;

    try {
        // Get submission with permission check
        let permissionQuery;
        let queryParams;

        if (req.user.role === 'guru') {
            // Guru bisa download submission dari kelas yang dia ajar
            permissionQuery = `
                SELECT s.*, a.title as assignment_title
                FROM submissions s
                JOIN assignments a ON s.assignment_id = a.id
                WHERE s.id = $1 AND a.teacher_id = $2
            `;
            queryParams = [submissionId, userId];
        } else if (req.user.role === 'siswa') {
            // Siswa hanya bisa download submission mereka sendiri
            permissionQuery = `
                SELECT s.*, a.title as assignment_title
                FROM submissions s
                JOIN assignments a ON s.assignment_id = a.id
                WHERE s.id = $1 AND s.student_id = $2
            `;
            queryParams = [submissionId, userId];
        } else {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses untuk mengunduh file ini.'
            });
        }

        const submissionResult = await pool.query(permissionQuery, queryParams);

        if (submissionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File submission tidak ditemukan atau Anda tidak memiliki akses.'
            });
        }

        const submission = submissionResult.rows[0];

        if (!submission.file_url) {
            return res.status(404).json({
                success: false,
                message: 'Tidak ada file yang dilampirkan pada submission ini.'
            });
        }

        // Construct file path
        const filePath = path.join(__dirname, '..', submission.file_url);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan di server.'
            });
        }

        // Get original filename dari path dan file stats
        const stats = fs.statSync(filePath);
        const originalFileName = path.basename(filePath);
        const fileExtension = path.extname(originalFileName).toLowerCase();

        // Set proper Content-Type based on file extension
        let contentType = 'application/octet-stream';
        switch (fileExtension) {
            case '.pdf':
                contentType = 'application/pdf';
                break;
            case '.doc':
                contentType = 'application/msword';
                break;
            case '.docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case '.ppt':
                contentType = 'application/vnd.ms-powerpoint';
                break;
            case '.pptx':
                contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                break;
            case '.xls':
                contentType = 'application/vnd.ms-excel';
                break;
            case '.xlsx':
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            case '.txt':
                contentType = 'text/plain';
                break;
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            case '.webp':
                contentType = 'image/webp';
                break;
            case '.zip':
                contentType = 'application/zip';
                break;
            case '.rar':
                contentType = 'application/x-rar-compressed';
                break;
            case '.7z':
                contentType = 'application/x-7z-compressed';
                break;
            default:
                contentType = 'application/octet-stream';
        }

        // Set appropriate headers untuk download yang benar
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${originalFileName.replace(/"/g, '\\"')}"`);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        // Send file
        res.sendFile(filePath, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${originalFileName.replace(/"/g, '\\"')}"`,
                'Content-Length': stats.size,
                'Cache-Control': 'no-cache'
            }
        }, (err) => {
            if (err) {
                console.error('Error sending submission file:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Gagal mengunduh file.'
                    });
                }
            } else {
                console.log('Submission file downloaded successfully:', originalFileName);
            }
        });

    } catch (error) {
        console.error('Error downloading submission file:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengunduh file.'
        });
    }
};


// Grade/Nilai submission
exports.gradeSubmission = async (req, res) => {
    const { submissionId } = req.params;
    const { score, feedback, status } = req.body;
    const teacherId = req.user.id;

    try {
        // Validasi input
        if (score === undefined || score === null) {
            return res.status(400).json({
                success: false,
                message: 'Nilai wajib diisi.'
            });
        }

        if (score < 0 || score > 100) {
            return res.status(400).json({
                success: false,
                message: 'Nilai harus antara 0-100.'
            });
        }

        // Check submission exists and teacher has access
        const submissionCheck = await pool.query(`
            SELECT s.*, a.title as assignment_title, a.points as max_points
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            WHERE s.id = $1 AND a.teacher_id = $2
        `, [submissionId, teacherId]);

        if (submissionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Submission tidak ditemukan atau Anda tidak memiliki akses.'
            });
        }

        const submission = submissionCheck.rows[0];
        const maxPoints = submission.max_points || 100;

        // Validasi score tidak melebihi maksimal poin assignment
        if (score > maxPoints) {
            return res.status(400).json({
                success: false,
                message: `Nilai tidak boleh melebihi maksimal poin tugas (${maxPoints}).`
            });
        }

        // Update submission dengan nilai dan feedback
        const result = await pool.query(`
            UPDATE submissions 
            SET 
                score = $1,
                feedback = $2,
                status = $3,
                graded_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `, [score, feedback || '', status || 'graded', submissionId]);

        res.json({
            success: true,
            message: 'Submission berhasil dinilai',
            submission: result.rows[0]
        });

    } catch (error) {
        console.error('Error grading submission:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat menilai submission.'
        });
    }
};

// Update grade/nilai submission (edit nilai)
exports.updateGrade = async (req, res) => {
    const { submissionId } = req.params;
    const { score, feedback, status } = req.body;
    const teacherId = req.user.id;

    try {
        // Check submission exists and teacher has access
        const submissionCheck = await pool.query(`
            SELECT s.*, a.title as assignment_title, a.points as max_points
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            WHERE s.id = $1 AND a.teacher_id = $2
        `, [submissionId, teacherId]);

        if (submissionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Submission tidak ditemukan atau Anda tidak memiliki akses.'
            });
        }

        const submission = submissionCheck.rows[0];
        const maxPoints = submission.max_points || 100;

        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 0;

        if (score !== undefined) {
            if (score < 0 || score > maxPoints) {
                return res.status(400).json({
                    success: false,
                    message: `Nilai harus antara 0-${maxPoints}.`
                });
            }
            updates.push(`score = $${++paramCount}`);
            values.push(score);
        }

        if (feedback !== undefined) {
            updates.push(`feedback = $${++paramCount}`);
            values.push(feedback);
        }

        if (status !== undefined) {
            updates.push(`status = $${++paramCount}`);
            values.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada data yang akan diubah.'
            });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(submissionId);

        const query = `
            UPDATE submissions 
            SET ${updates.join(', ')} 
            WHERE id = $${++paramCount} 
            RETURNING *
        `;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Nilai berhasil diperbarui',
            submission: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating grade:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat memperbarui nilai.'
        });
    }
};

// Get detailed submissions for grading
exports.getSubmissionsForGrading = async (req, res) => {
    const { assignmentId } = req.params;
    const teacherId = req.user.id;

    try {
        // Verify teacher has access to this assignment
        const assignmentCheck = await pool.query(`
            SELECT a.*, c.name as class_name
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            WHERE a.id = $1 AND a.teacher_id = $2
        `, [assignmentId, teacherId]);

        if (assignmentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tugas tidak ditemukan atau Anda tidak memiliki akses.'
            });
        }

        const assignment = assignmentCheck.rows[0];

        // Get all students in the class (including those who haven't submitted)
        const allStudents = await pool.query(`
            SELECT 
                cm.user_id,
                s.nama_lengkap,
                s.nis,
                u.email
            FROM class_members cm
            JOIN users u ON cm.user_id = u.id
            JOIN siswa s ON u.id = s.user_id
            WHERE cm.class_id = $1
            ORDER BY s.nama_lengkap
        `, [assignment.class_id]);

        // Get submissions with student details
        const submissions = await Promise.all(
            allStudents.rows.map(async (student) => {
                const submissionResult = await pool.query(`
                    SELECT * FROM submissions 
                    WHERE assignment_id = $1 AND student_id = $2
                    ORDER BY submitted_at DESC
                    LIMIT 1
                `, [assignmentId, student.user_id]);

                return {
                    student_id: student.user_id,
                    student_name: student.nama_lengkap,
                    student_nis: student.nis,
                    student_email: student.email,
                    submission: submissionResult.rows[0] || null,
                    status: submissionResult.rows[0] ? submissionResult.rows[0].status : 'not_submitted'
                };
            })
        );

        // Get statistics
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_submissions,
                COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending_grading,
                COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_count,
                AVG(CASE WHEN score IS NOT NULL THEN score END) as average_score
            FROM submissions 
            WHERE assignment_id = $1
        `, [assignmentId]);

        res.json({
            success: true,
            assignment,
            submissions,
            stats: {
                ...stats.rows[0],
                total_students: allStudents.rows.length,
                not_submitted: allStudents.rows.length - parseInt(stats.rows[0].total_submissions)
            }
        });

    } catch (error) {
        console.error('Error getting submissions for grading:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server.'
        });
    }
};