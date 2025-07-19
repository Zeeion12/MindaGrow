const express = require('express');
const router = express.Router();
const {
    getStudentScoresBySubject,
    getStudentAllScores,
    getStudentScoresBySpecificSubject
} = require('../controller/studentScoreController'); // pastikan path benar

// Middleware authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Akses ditolak' });

    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
        if (err) return res.status(403).json({ message: 'Token tidak valid' });
        req.user = user;
        next();
    });
};

// Routes
router.get('/student-scores/subjects', authenticateToken, getStudentScoresBySubject);
router.get('/student-scores/all', authenticateToken, getStudentAllScores);
router.get('/student-scores/class/:classId', authenticateToken, getStudentScoresBySpecificSubject);

module.exports = router;