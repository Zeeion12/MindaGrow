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

// Helper function untuk validasi kepemilikan kelas
const validateClassOwnership = async (classId, teacherId) => {
    const result = await pool.query(
        'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
        [classId, teacherId]
    );
    return result.rows.length > 0;
};

// Helper function untuk validasi kepemilikan assignment
const validateAssignmentOwnership = async (assignmentId, teacherId) => {
    const result = await pool.query(
        'SELECT a.id FROM assignments a JOIN classes c ON a.class_id = c.id WHERE a.id = $1 AND c.teacher_id = $2',
        [assignmentId, teacherId]
    );
    return result.rows.length > 0;
};

// Guru: Membuat assignment/tugas baru
exports.createAssignment = async (req, res) => {
    const { classId } = req.params;
    const { title, description, due_date, points } = req.body;
    const teacherId = req.user.id;

    // Ambil informasi file dari req.file jika ada file yang diupload
    let fileUrl = null;
    if (req.file) {
        fileUrl = `uploads/assignments/${req.file.filename}`; // Path relatif
        console.log('File URL:', fileUrl);
    }

    // Validasi input
    if (!title || !description) {
        console.log('Validation failed: Missing title or description');
        return res.status(400).json({
            success: false,
            message: 'Judul dan deskripsi tugas wajib diisi.'
        });
    }

    try {
        // Validasi kepemilikan kelas
        const isOwner = await validateClassOwnership(classId, teacherId);
        if (!isOwner) {
            console.log('Validation failed: Not class owner');
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk membuat tugas di kelas ini.'
            });
        }

        // Validasi format tanggal jika ada
        let formattedDueDate = null;
        if (due_date) {
            formattedDueDate = new Date(due_date);
            if (isNaN(formattedDueDate.getTime())) {
                console.log('Validation failed: Invalid date format');
                return res.status(400).json({
                    success: false,
                    message: 'Format tanggal deadline tidak valid.'
                });
            }
        }

        console.log('Formatted due date:', formattedDueDate);

        // Insert assignment ke database
        const result = await pool.query(
            `INSERT INTO assignments (class_id, teacher_id, title, description, due_date, points, file_url, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [classId, teacherId, title, description, formattedDueDate, points || 100, fileUrl, 'active']
        );

        console.log('Assignment inserted:', result.rows[0]);

        // Get class info untuk response
        const classInfo = await pool.query(
            'SELECT name FROM classes WHERE id = $1',
            [classId]
        );

        res.status(201).json({
            success: true,
            message: 'Tugas berhasil dibuat',
            assignment: {
                ...result.rows[0],
                class_name: classInfo.rows[0]?.name
            }
        });
    } catch (error) {
        console.error('Error creating assignment:', error);

        // Hapus file yang sudah diupload jika terjadi error database
        if (req.file && req.file.path) {
            try {
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log('Deleted uploaded file due to error');
                }
            } catch (unlinkError) {
                console.error('Error deleting uploaded file on DB error:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat membuat tugas.'
        });
    }
};

// Guru: Mendapatkan semua assignments dari kelas yang diajar
exports.getAssignmentsByTeacher = async (req, res) => {
    const teacherId = req.user.id;
    const { classId } = req.query;

    try {
        let query = `
            SELECT 
                a.*,
                c.name as class_name,
                c.grade as class_grade,
                COUNT(s.id) as total_submissions,
                COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_count,
                COUNT(CASE WHEN s.status IN ('submitted', 'pending_grading') THEN 1 END) as pending_count
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            LEFT JOIN submissions s ON a.id = s.assignment_id
            WHERE a.teacher_id = $1
        `;

        const params = [teacherId];

        if (classId) {
            query += ' AND a.class_id = $2';
            params.push(classId);
        }

        query += ' GROUP BY a.id, c.name, c.grade ORDER BY a.created_at DESC';

        const result = await pool.query(query, params);

        // **TAMBAH** - Transform data dengan stats yang benar
        const transformedAssignments = result.rows.map(assignment => ({
            ...assignment,
            graded_count: parseInt(assignment.graded_count) || 0,
            pending_count: parseInt(assignment.pending_count) || 0
        }));

        res.json({
            success: true,
            assignments: transformedAssignments
        });
    } catch (error) {
        console.error('Error fetching assignments by teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengambil daftar tugas.'
        });
    }
};

// Siswa: Mendapatkan assignments dari kelas yang diikuti
exports.getAssignmentsByStudent = async (req, res) => {
    const studentId = req.user.id;
    const { classId } = req.query; // Optional filter by class

    try {
        let query = `
            SELECT 
                a.*,
                c.name as class_name,
                c.grade as class_grade,
                g.nama_lengkap as teacher_name,
                s.id as submission_id,
                s.submitted_at,
                s.status as submission_status,
                s.score
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            JOIN class_members cm ON c.id = cm.class_id
            JOIN guru g ON c.teacher_id = g.user_id
            LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
            WHERE cm.user_id = $1 AND a.status = 'active'
        `;

        const params = [studentId];

        if (classId) {
            query += ' AND a.class_id = $2';
            params.push(classId);
        }

        query += ' ORDER BY a.due_date ASC, a.created_at DESC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            assignments: result.rows
        });
    } catch (error) {
        console.error('Error fetching assignments by student:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengambil daftar tugas.'
        });
    }
};

// Get assignment by ID (untuk guru dan siswa yang terkait)
exports.getAssignmentById = async (req, res) => {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const assignmentQuery = `
            SELECT 
                a.*,
                c.name as class_name,
                c.grade as class_grade,
                g.nama_lengkap as teacher_name,
                u.email as teacher_email
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            JOIN guru g ON c.teacher_id = g.user_id
            JOIN users u ON g.user_id = u.id
            WHERE a.id = $1
        `;

        const assignmentResult = await pool.query(assignmentQuery, [assignmentId]);

        if (assignmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tugas tidak ditemukan.'
            });
        }

        const assignment = assignmentResult.rows[0];

        // Validasi akses berdasarkan role
        if (userRole === 'guru') {
            // Guru harus pemilik kelas
            const isOwner = await validateAssignmentOwnership(assignmentId, userId);
            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki akses ke tugas ini.'
                });
            }
        } else if (userRole === 'siswa') {
            // Siswa harus anggota kelas
            const memberCheck = await pool.query(
                'SELECT id FROM class_members WHERE class_id = $1 AND user_id = $2',
                [assignment.class_id, userId]
            );
            if (memberCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki akses ke tugas ini.'
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak.'
            });
        }

        // Jika siswa, ambil juga info submission
        let submissionInfo = null;
        if (userRole === 'siswa') {
            const submissionResult = await pool.query(
                'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
                [assignmentId, userId]
            );
            submissionInfo = submissionResult.rows[0] || null;
        }

        // Jika guru, ambil statistik submissions
        let submissionStats = null;
        if (userRole === 'guru') {
            const statsResult = await pool.query(`
                SELECT 
                    COUNT(*) as total_submissions,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
                    COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_count,
                    AVG(score) as average_score
                FROM submissions 
                WHERE assignment_id = $1
            `, [assignmentId]);
            submissionStats = statsResult.rows[0];

            // Get total students in class
            const classStatsResult = await pool.query(
                'SELECT COUNT(*) as total_students FROM class_members WHERE class_id = $1',
                [assignment.class_id]
            );
            submissionStats.total_students = parseInt(classStatsResult.rows[0].total_students);
        }

        res.json({
            success: true,
            assignment,
            submission: submissionInfo,
            stats: submissionStats
        });
    } catch (error) {
        console.error('Error fetching assignment by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengambil detail tugas.'
        });
    }
};

// Guru: Update assignment
exports.updateAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const { title, description, due_date, points, file_url, status } = req.body;
    const teacherId = req.user.id;

    try {
        // Validasi kepemilikan assignment
        const isOwner = await validateAssignmentOwnership(assignmentId, teacherId);
        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk mengubah tugas ini.'
            });
        }

        // Validasi format tanggal jika ada
        let formattedDueDate = null;
        if (due_date) {
            formattedDueDate = new Date(due_date);
            if (isNaN(formattedDueDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Format tanggal deadline tidak valid.'
                });
            }
        }

        // Build update query dinamis
        const updates = [];
        const values = [];
        let paramCount = 0;

        if (title !== undefined) {
            updates.push(`title = $${++paramCount}`);
            values.push(title);
        }
        if (description !== undefined) {
            updates.push(`description = $${++paramCount}`);
            values.push(description);
        }
        if (due_date !== undefined) {
            updates.push(`due_date = $${++paramCount}`);
            values.push(formattedDueDate);
        }
        if (points !== undefined) {
            updates.push(`points = $${++paramCount}`);
            values.push(points);
        }
        if (file_url !== undefined) {
            updates.push(`file_url = $${++paramCount}`);
            values.push(file_url);
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
        values.push(assignmentId);

        const query = `
            UPDATE assignments 
            SET ${updates.join(', ')} 
            WHERE id = $${++paramCount} 
            RETURNING *
        `;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Tugas berhasil diperbarui',
            assignment: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat memperbarui tugas.'
        });
    }
};

// Guru: Delete assignment
exports.deleteAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const teacherId = req.user.id;

    try {
        // Validasi kepemilikan assignment
        const isOwner = await validateAssignmentOwnership(assignmentId, teacherId);
        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk menghapus tugas ini.'
            });
        }

        // Soft delete - ubah status menjadi inactive
        const result = await pool.query(
            'UPDATE assignments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING title',
            ['inactive', assignmentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tugas tidak ditemukan.'
            });
        }

        res.json({
            success: true,
            message: `Tugas "${result.rows[0].title}" berhasil dihapus`
        });
    } catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat menghapus tugas.'
        });
    }
};

// Get assignments by class ID (untuk UI kelas detail)
exports.getAssignmentsByClass = async (req, res) => {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Validasi akses ke kelas
        let hasAccess = false;
        if (userRole === 'guru') {
            const ownerCheck = await pool.query(
                'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
                [classId, userId]
            );
            hasAccess = ownerCheck.rows.length > 0;
        } else if (userRole === 'siswa') {
            const memberCheck = await pool.query(
                'SELECT id FROM class_members WHERE class_id = $1 AND user_id = $2',
                [classId, userId]
            );
            hasAccess = memberCheck.rows.length > 0;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses ke kelas ini.'
            });
        }

        let query = `
            SELECT 
                a.*,
                COUNT(s.id) as total_submissions
            FROM assignments a
            LEFT JOIN submissions s ON a.id = s.assignment_id
            WHERE a.class_id = $1 AND a.status = 'active'
        `;

        // **UBAH** - Jika siswa, tambahkan score ke query
        if (userRole === 'siswa') {
            query = `
                SELECT 
                    a.*,
                    COUNT(s.id) as total_submissions,
                    my_s.id as my_submission_id,
                    my_s.status as my_submission_status,
                    my_s.submitted_at as my_submitted_at,
                    my_s.score as my_score,
                    my_s.feedback as my_feedback,
                    my_s.file_url as my_submission_file_url
                FROM assignments a
                LEFT JOIN submissions s ON a.id = s.assignment_id
                LEFT JOIN submissions my_s ON a.id = my_s.assignment_id AND my_s.student_id = $2
                WHERE a.class_id = $1 AND a.status = 'active'
            `;
        }

        query += ' GROUP BY a.id';

        if (userRole === 'siswa') {
            query += ', my_s.id, my_s.status, my_s.submitted_at, my_s.score, my_s.feedback';
        }

        query += ' ORDER BY a.due_date ASC, a.created_at DESC';

        const params = userRole === 'siswa' ? [classId, userId] : [classId];
        const result = await pool.query(query, params);

        res.json({
            success: true,
            assignments: result.rows
        });
    } catch (error) {
        console.error('Error fetching assignments by class:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengambil daftar tugas.'
        });
    }
};

// Download assignment file - FIXED VERSION
exports.downloadAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Get assignment info
        const assignmentResult = await pool.query(`
            SELECT 
                a.*,
                c.teacher_id
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            WHERE a.id = $1 AND a.status = 'active'
        `, [assignmentId]);

        if (assignmentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tugas tidak ditemukan.'
            });
        }

        const assignment = assignmentResult.rows[0];

        // Validasi akses
        let hasAccess = false;
        if (userRole === 'guru' && assignment.teacher_id === userId) {
            hasAccess = true;
        } else if (userRole === 'siswa') {
            const memberCheck = await pool.query(
                'SELECT id FROM class_members WHERE class_id = $1 AND user_id = $2',
                [assignment.class_id, userId]
            );
            hasAccess = memberCheck.rows.length > 0;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses untuk mengunduh tugas ini.'
            });
        }

        // Check if file exists
        if (!assignment.file_url) {
            return res.status(404).json({
                success: false,
                message: 'File tugas tidak tersedia.'
            });
        }

        const filePath = path.join(__dirname, '..', assignment.file_url);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan di server.'
            });
        }

        // Get original filename dan set proper headers
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
            case '.zip':
                contentType = 'application/zip';
                break;
            case '.rar':
                contentType = 'application/x-rar-compressed';
                break;
            default:
                contentType = 'application/octet-stream';
        }

        // Set headers untuk download yang benar
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
                console.error('Error sending assignment file:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Terjadi kesalahan saat mengunduh file.'
                    });
                }
            } else {
                console.log('Assignment file downloaded successfully:', originalFileName);
            }
        });

    } catch (error) {
        console.error('Error downloading assignment:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server saat mengunduh tugas.'
            });
        }
    }
};

