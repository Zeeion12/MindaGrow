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

        // Get all submissions for this assignment
        const submissions = await pool.query(`
            SELECT 
                s.*,
                siswa.nama_lengkap as student_name,
                siswa.nis as student_nis,
                users.email as student_email
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