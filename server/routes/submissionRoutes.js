const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const submissionController = require('../controller/submissionController');
const authenticateToken = require('../middleware/auth');

// Setup multer for submission file uploads - IMPROVED VERSION
const submissionStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'submissions');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `submission_${uniqueSuffix}_${safeName}`;
        cb(null, fileName);
    }
});

const uploadSubmission = multer({
    storage: submissionStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        console.log('File received:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });

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
            // Archives
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/x-zip-compressed'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.log('File type not allowed:', file.mimetype);
            cb(new Error(`File type ${file.mimetype} not allowed for submissions. Allowed types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG, GIF, WEBP, ZIP, RAR, 7Z`), false);
        }
    }
});

// Middleware untuk handle multer errors
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File terlalu besar. Maksimal ukuran file adalah 10MB.'
            });
        }
    } else if (error) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Error uploading file.'
        });
    }
    next();
};

// Submit assignment - IMPROVED VERSION
router.post('/assignments/:assignmentId/submit',
    authenticateToken,
    (req, res, next) => {
        if (req.user.role !== 'siswa') {
            return res.status(403).json({
                success: false,
                message: 'Hanya siswa yang dapat mengumpulkan tugas.'
            });
        }
        next();
    },
    uploadSubmission.single('file'),
    handleMulterError,
    submissionController.submitAssignment
);

// Get submissions by assignment (untuk guru)
router.get('/assignments/:assignmentId/submissions',
    authenticateToken,
    (req, res, next) => {
        if (req.user.role !== 'guru') {
            return res.status(403).json({
                success: false,
                message: 'Hanya guru yang dapat melihat daftar submission.'
            });
        }
        next();
    },
    submissionController.getSubmissionsByAssignment
);

// Download submission file - NEW ROUTE
router.get('/submissions/:submissionId/download',
    authenticateToken,
    submissionController.downloadSubmissionFile
);

//  ===== UNTUK UPDATE NILAI =====

// Grade submission (memberikan nilai)
router.post('/submissions/:submissionId/grade',
    authenticateToken,
    (req, res, next) => {
        if (req.user.role !== 'guru') {
            return res.status(403).json({
                success: false,
                message: 'Hanya guru yang dapat menilai submission.'
            });
        }
        next();
    },
    submissionController.gradeSubmission
);

// Update grade (edit nilai)
router.put('/submissions/:submissionId/grade',
    authenticateToken,
    (req, res, next) => {
        if (req.user.role !== 'guru') {
            return res.status(403).json({
                success: false,
                message: 'Hanya guru yang dapat mengubah nilai submission.'
            });
        }
        next();
    },
    submissionController.updateGrade
);

// Get submissions for grading (dengan detail lengkap)
router.get('/assignments/:assignmentId/grading',
    authenticateToken,
    (req, res, next) => {
        if (req.user.role !== 'guru') {
            return res.status(403).json({
                success: false,
                message: 'Hanya guru yang dapat mengakses halaman penilaian.'
            });
        }
        next();
    },
    submissionController.getSubmissionsForGrading
);

module.exports = router;