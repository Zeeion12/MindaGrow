const express = require('express');
const router = express.Router();
const assignmentController = require('../controller/assignmentController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import middleware auth yang sudah ada
const authenticateToken = require('../middleware/auth');

// Setup multer untuk upload file assignment
const assignmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'assignments'); // Sesuaikan path

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const fileName = `assignment_${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
    }
});

const uploadAssignment = multer({
    storage: assignmentStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Misalnya 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Tipe file yang diizinkan (contoh, bisa disesuaikan)
        const allowedTypes = [
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/avi', 'video/mkv', 'video/mov', 'video/webm',
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed for assignments`), false);
        }
    }
});


// Middleware untuk memastikan user adalah guru
const requireTeacher = (req, res, next) => {
    if (req.user.role !== 'guru') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya guru yang diizinkan.'
        });
    }
    next();
};

// Middleware untuk memastikan user adalah siswa
const requireStudent = (req, res, next) => {
    if (req.user.role !== 'siswa') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya siswa yang diizinkan.'
        });
    }
    next();
};

// Middleware untuk guru atau siswa
const requireTeacherOrStudent = (req, res, next) => {
    if (req.user.role !== 'guru' && req.user.role !== 'siswa') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya guru atau siswa yang diizinkan.'
        });
    }
    next();
};





// --- TAMBAHKAN ERROR HANDLER UNTUK MULTER DI AKHIR FILE INI ---
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File tugas terlalu besar. Maksimal 10MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Error uploading file: ' + error.message
        });
    }

    if (error.message && error.message.includes('not allowed for assignments')) {
        return res.status(400).json({
            success: false,
            message: 'Tipe file tugas tidak diizinkan.'
        });
    }

    next(error);
});
// --- AKHIR ERROR HANDLER MULTER ---


// ===============================
// ROUTES UNTUK GURU
// ===============================

// Guru: Membuat assignment baru di kelas tertentu
router.post('/classes/:classId/assignments',
    authenticateToken,
    requireTeacher,
    uploadAssignment.single('file'),
    assignmentController.createAssignment
);

// Guru: Mendapatkan semua assignments yang dia buat
router.get('/teacher/assignments',
    authenticateToken,
    requireTeacher,
    assignmentController.getAssignmentsByTeacher
);

// Guru: Update assignment
router.put('/assignments/:assignmentId',
    authenticateToken,
    requireTeacher,
    assignmentController.updateAssignment
);

// Guru: Delete assignment (soft delete)
router.delete('/assignments/:assignmentId',
    authenticateToken,
    requireTeacher,
    assignmentController.deleteAssignment
);

// ===============================
// ROUTES UNTUK SISWA
// ===============================

// Siswa: Mendapatkan semua assignments dari kelas yang diikuti
router.get('/student/assignments',
    authenticateToken,
    requireStudent,
    assignmentController.getAssignmentsByStudent
);

// ===============================
// ROUTES UNTUK GURU DAN SISWA
// ===============================

// Get assignment by ID (guru dan siswa yang terkait)
router.get('/assignments/:assignmentId',
    authenticateToken,
    requireTeacherOrStudent,
    assignmentController.getAssignmentById
);

// Get assignments by class ID (untuk UI detail kelas)
router.get('/classes/:classId/assignments',
    authenticateToken,
    requireTeacherOrStudent,
    assignmentController.getAssignmentsByClass
);

// Download assignment file
router.get('/assignments/:assignmentId/download',
    authenticateToken,
    requireTeacherOrStudent,
    assignmentController.downloadAssignment
);

module.exports = router;