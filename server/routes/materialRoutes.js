const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const materialController = require('../controller/materialController');

// Import middleware auth yang sudah ada
const authenticateToken = require('../middleware/auth');

// Setup multer untuk upload file materials
const materialStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'materials');

        // Buat direktori jika belum ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Buat nama file unik dengan timestamp dan random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const fileName = `material_${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
    }
});

const uploadMaterial = multer({
    storage: materialStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit untuk materials
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types untuk materials
        const allowedTypes = [
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',

            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',

            // Videos
            'video/mp4',
            'video/avi',
            'video/mkv',
            'video/mov',
            'video/webm',

            // Archives
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed for materials`), false);
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

// ===============================
// ROUTES UNTUK GURU
// ===============================

// Guru: Membuat material baru di kelas tertentu
router.post('/classes/:classId/materials',
    authenticateToken,
    requireTeacher,
    uploadMaterial.single('file'), // 'file' adalah nama field di form
    materialController.createMaterial
);

// Guru: Mendapatkan semua materials yang dia buat
router.get('/teacher/materials',
    authenticateToken,
    requireTeacher,
    materialController.getMaterialsByTeacher
);

// Guru: Update material
router.put('/materials/:materialId',
    authenticateToken,
    requireTeacher,
    uploadMaterial.single('file'), // Optional file update
    materialController.updateMaterial
);

// Guru: Delete material (soft delete)
router.delete('/materials/:materialId',
    authenticateToken,
    requireTeacher,
    materialController.deleteMaterial
);

// ===============================
// ROUTES UNTUK SISWA
// ===============================

// Siswa: Mendapatkan semua materials dari kelas yang diikuti
router.get('/student/materials',
    authenticateToken,
    requireStudent,
    materialController.getMaterialsByStudent
);

// ===============================
// ROUTES UNTUK GURU DAN SISWA
// ===============================

// Get material by ID (guru dan siswa yang terkait)
router.get('/materials/:materialId',
    authenticateToken,
    requireTeacherOrStudent,
    materialController.getMaterialById
);

// Get materials by class ID (untuk UI detail kelas)
router.get('/classes/:classId/materials',
    authenticateToken,
    requireTeacherOrStudent,
    materialController.getMaterialsByClass
);

// Download material file
router.get('/materials/:materialId/download',
    authenticateToken,
    requireTeacherOrStudent,
    materialController.downloadMaterial
);

// Error handler untuk multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File terlalu besar. Maksimal 10MB untuk materi.'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Error uploading file: ' + error.message
        });
    }

    if (error.message && error.message.includes('not allowed')) {
        return res.status(400).json({
            success: false,
            message: 'Tipe file tidak diizinkan. Hanya dokumen, gambar, video, dan arsip yang diperbolehkan.'
        });
    }

    next(error);
});

module.exports = router;