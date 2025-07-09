const express = require('express');
const router = express.Router();
const classController = require('../controller/classController');

// Import middleware auth yang sudah ada
const authenticateToken = require('../middleware/auth');

// Middleware untuk memastikan user adalah guru
const requireTeacher = (req, res, next) => {
    if (req.user.role !== 'guru') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya guru yang diizinkan.' });
    }
    next();
};

// Middleware untuk memastikan user adalah siswa
const requireStudent = (req, res, next) => {
    if (req.user.role !== 'siswa') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya siswa yang diizinkan.' });
    }
    next();
};

// Guru: Membuat kelas baru
router.post('/classes', authenticateToken, requireTeacher, classController.createClass);

// Guru: Menghapus kelas
router.delete('/classes/:classId', authenticateToken, requireTeacher, classController.deleteClass);

// Guru: Menambah siswa ke kelas
router.post('/classes/:classId/members', authenticateToken, requireTeacher, classController.addStudentToClass);

// Guru: Menghapus siswa dari kelas
router.delete('/classes/:classId/members/:userId', authenticateToken, requireTeacher, classController.removeStudentFromClass);

// Guru: Mendapatkan daftar kelas yang dia ajar
router.get('/teacher/classes', authenticateToken, requireTeacher, classController.getClassesForTeacher);

// Siswa: Mendapatkan daftar kelas yang diikuti
router.get('/student/classes', authenticateToken, requireStudent, classController.getClassesForStudent);

// Mendapatkan detail kelas (bisa diakses guru/siswa jika anggota)
router.get('/classes/:classId', authenticateToken, classController.getClassDetails);

module.exports = router;