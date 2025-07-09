const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'mindagrow',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

// Helper function to get user details (nama_lengkap, etc.)
const getUserDetails = async (userId, role) => {
    let query;
    if (role === 'siswa') {
        query = 'SELECT nama_lengkap, nis FROM siswa WHERE user_id = $1';
    } else if (role === 'guru') {
        query = 'SELECT nama_lengkap, nuptk FROM guru WHERE user_id = $1';
    } else {
        return null;
    }
    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

// Guru: Membuat kelas baru
exports.createClass = async (req, res) => {
    const { name, grade, description, schedule } = req.body;
    const teacherId = req.user.id; // ID guru dari token

    if (!name || !grade || !schedule) {
        return res.status(400).json({ message: 'Nama kelas, tingkatan, dan jadwal wajib diisi.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO classes (name, grade, teacher_id, description, schedule) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, grade, teacherId, description, schedule]
        );
        res.status(201).json({ message: 'Kelas berhasil dibuat', class: result.rows[0] });
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server saat membuat kelas.' });
    }
};

// Guru: Menghapus kelas
exports.deleteClass = async (req, res) => {
    const { classId } = req.params;
    const teacherId = req.user.id;

    try {
        // Pastikan guru yang menghapus adalah pemilik kelas
        const checkClass = await pool.query(
            'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
            [classId, teacherId]
        );

        if (checkClass.rows.length === 0) {
            return res.status(404).json({ message: 'Kelas tidak ditemukan atau Anda tidak memiliki izin untuk menghapus kelas ini.' });
        }

        // Hapus kelas dan semua anggota terkait (ON DELETE CASCADE di DB)
        await pool.query('DELETE FROM classes WHERE id = $1', [classId]);
        res.json({ message: 'Kelas berhasil dihapus.' });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server saat menghapus kelas.' });
    }
};

// Guru: Menambah siswa ke kelas
exports.addStudentToClass = async (req, res) => {
    const { classId } = req.params;
    const { nis } = req.body; // Menggunakan NIS untuk mencari siswa
    const teacherId = req.user.id;

    if (!nis) {
        return res.status(400).json({ message: 'NIS siswa wajib diisi.' });
    }

    try {
        // Pastikan guru yang menambah adalah pemilik kelas
        const checkClass = await pool.query(
            'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
            [classId, teacherId]
        );

        if (checkClass.rows.length === 0) {
            return res.status(404).json({ message: 'Kelas tidak ditemukan atau Anda tidak memiliki izin untuk mengelola kelas ini.' });
        }

        // Cari siswa berdasarkan NIS
        const studentResult = await pool.query(
            'SELECT u.id AS user_id, s.nama_lengkap FROM users u JOIN siswa s ON u.id = s.user_id WHERE s.nis = $1',
            [nis]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Siswa dengan NIS tersebut tidak ditemukan.' });
        }

        const studentUserId = studentResult.rows[0].user_id;
        const studentName = studentResult.rows[0].nama_lengkap;

        // Cek apakah siswa sudah menjadi anggota kelas
        const existingMember = await pool.query(
            'SELECT * FROM class_members WHERE class_id = $1 AND user_id = $2',
            [classId, studentUserId]
        );

        if (existingMember.rows.length > 0) {
            return res.status(409).json({ message: 'Siswa sudah menjadi anggota kelas ini.' });
        }

        // Tambahkan siswa ke class_members
        await pool.query(
            'INSERT INTO class_members (class_id, user_id) VALUES ($1, $2)',
            [classId, studentUserId]
        );

        res.status(201).json({
            message: `Siswa ${studentName} berhasil ditambahkan ke kelas.`,
            student: {
                id: studentUserId,
                nama_lengkap: studentName,
                nis
            }
        });
    } catch (error) {
        console.error('Error adding student to class:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server saat menambahkan siswa.' });
    }
};

// Guru: Menghapus siswa dari kelas
exports.removeStudentFromClass = async (req, res) => {
    const { classId, userId } = req.params;
    const teacherId = req.user.id;

    try {
        // Pastikan guru yang menghapus adalah pemilik kelas
        const checkClass = await pool.query(
            'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2',
            [classId, teacherId]
        );

        if (checkClass.rows.length === 0) {
            return res.status(404).json({ message: 'Kelas tidak ditemukan atau Anda tidak memiliki izin untuk mengelola kelas ini.' });
        }

        // Hapus siswa dari class_members
        const result = await pool.query(
            'DELETE FROM class_members WHERE class_id = $1 AND user_id = $2 RETURNING *',
            [classId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Siswa tidak ditemukan di kelas ini.' });
        }

        res.json({ message: 'Siswa berhasil dihapus dari kelas.' });
    } catch (error) {
        console.error('Error removing student from class:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server saat menghapus siswa.' });
    }
};

// Guru: Mendapatkan daftar kelas yang dia ajar
exports.getClassesForTeacher = async (req, res) => {
    const teacherId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT 
                c.id, 
                c.name, 
                c.grade, 
                c.description, 
                c.schedule, 
                c.status,
                COUNT(cm.user_id) AS total_students
            FROM classes c
            LEFT JOIN class_members cm ON c.id = cm.class_id
            WHERE c.teacher_id = $1
            GROUP BY c.id
            ORDER BY c.created_at DESC`,
            [teacherId]
        );
        res.json({ classes: result.rows });
    } catch (error) {
        console.error('Error fetching classes for teacher:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil daftar kelas.' });
    }
};

// Siswa: Mendapatkan daftar kelas yang diikuti
exports.getClassesForStudent = async (req, res) => {
    const studentId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT 
                c.id, 
                c.name, 
                c.grade, 
                c.description, 
                c.schedule, 
                c.status,
                g.nama_lengkap AS teacher_name
            FROM classes c
            JOIN class_members cm ON c.id = cm.class_id
            JOIN guru g ON c.teacher_id = g.user_id
            JOIN users u ON g.user_id = u.id
            WHERE cm.user_id = $1
            ORDER BY c.created_at DESC`,
            [studentId]
        );
        res.json({ classes: result.rows });
    } catch (error) {
        console.error('Error fetching classes for student:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil daftar kelas.' });
    }
};

// Mendapatkan detail kelas (termasuk anggota)
exports.getClassDetails = async (req, res) => {
    const { classId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Dapatkan detail kelas
        const classResult = await pool.query(
            `SELECT 
                c.id, 
                c.name, 
                c.grade, 
                c.description, 
                c.schedule, 
                c.status,
                c.teacher_id,
                g.nama_lengkap AS teacher_name,
                g.nuptk AS teacher_nuptk,
                u_teacher.email AS teacher_email
            FROM classes c
            JOIN guru g ON c.teacher_id = g.user_id
            JOIN users u_teacher ON g.user_id = u_teacher.id
            WHERE c.id = $1`,
            [classId]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
        }

        const classDetails = classResult.rows[0];

        // Periksa apakah user adalah guru pemilik kelas atau anggota kelas
        let isMember = false;
        if (userRole === 'guru' && classDetails.teacher_id === userId) {
            isMember = true; // Guru pemilik kelas
        } else {
            const memberCheck = await pool.query(
                'SELECT * FROM class_members WHERE class_id = $1 AND user_id = $2',
                [classId, userId]
            );
            if (memberCheck.rows.length > 0) {
                isMember = true; // Siswa anggota kelas
            }
        }

        if (!isMember) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke detail kelas ini.' });
        }

        // Dapatkan daftar anggota (siswa)
        const membersResult = await pool.query(
            `SELECT 
                u.id AS user_id, 
                s.nama_lengkap, 
                s.nis,
                u.email
            FROM class_members cm
            JOIN users u ON cm.user_id = u.id
            JOIN siswa s ON u.id = s.user_id
            WHERE cm.class_id = $1
            ORDER BY s.nama_lengkap`,
            [classId]
        );

        res.json({
            class: classDetails,
            teacher: {
                id: classDetails.teacher_id,
                name: classDetails.teacher_name,
                nuptk: classDetails.teacher_nuptk,
                email: classDetails.teacher_email
            },
            members: membersResult.rows
        });

    } catch (error) {
        console.error('Error fetching class details:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil detail kelas.' });
    }
};