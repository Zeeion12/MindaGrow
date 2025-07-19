const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { generateScoreInsights } = require('../services/scoreAnalysisService');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'mindagrow',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak. Token tidak ditemukan.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token tidak valid'
            });
        }
        req.user = user;
        next();
    });
};

// Get score insights with AI analysis
router.get('/score-insights', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get student scores data
        const scoreQuery = `
            SELECT 
                c.name as subject_name,
                ROUND(AVG(s.score), 2) as average_score,
                COUNT(s.id) as total_assignments,
                array_agg(s.score) FILTER (WHERE s.score IS NOT NULL) as all_scores
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN classes c ON a.class_id = c.id
            WHERE s.student_id = $1 
                AND s.score IS NOT NULL
                AND s.status = 'graded'
                AND c.status = 'active'
            GROUP BY c.id, c.name
            ORDER BY average_score DESC
        `;

        const scoreResult = await pool.query(scoreQuery, [userId]);
        const scoreData = scoreResult.rows;

        // Get user profile
        const userQuery = `
            SELECT role, email, created_at 
            FROM users 
            WHERE id = $1
        `;
        const userResult = await pool.query(userQuery, [userId]);
        const userProfile = userResult.rows[0];

        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate AI insights if there's data
        let insights = null;
        if (scoreData.length > 0) {
            try {
                insights = await generateScoreInsights(scoreData, userProfile);
            } catch (error) {
                console.error('AI score insights generation failed:', error);
                // Return simple rule-based insights as fallback
                insights = generateSimpleScoreInsights(scoreData, userProfile);
            }
        } else {
            // Generate insights for no data scenario
            insights = generateSimpleScoreInsights(scoreData, userProfile);
        }

        res.json({
            success: true,
            data: {
                scoreData,
                insights
            }
        });

    } catch (error) {
        console.error('Error fetching score insights:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch score insights: ' + error.message
        });
    }
});

// Fallback function untuk generate simple insights jika OpenAI gagal
function generateSimpleScoreInsights(scoreData, userProfile) {
    if (scoreData.length === 0) {
        return {
            status: 'needs_improvement',
            summary: 'Belum ada data nilai tugas yang tersedia',
            insights: [
                'Anda belum memiliki nilai tugas di mata pelajaran apapun',
                'Mulai mengerjakan dan mengumpulkan tugas untuk melihat progress akademik',
                'Konsistensi dalam mengerjakan tugas akan membantu meningkatkan pemahaman'
            ],
            recommendations: [
                {
                    title: 'Mulai Aktif Mengerjakan Tugas',
                    description: 'Kerjakan semua tugas yang diberikan guru untuk membangun rekam jejak akademik',
                    priority: 'high'
                }
            ],
            academic_analysis: {
                strongest_subject: 'Belum ada data',
                weakest_subject: 'Belum ada data',
                overall_performance: 'Belum dapat dinilai karena belum ada data tugas',
                consistency_level: 'tidak dapat dinilai'
            }
        };
    }

    const averageScore = scoreData.reduce((sum, item) => sum + parseFloat(item.average_score), 0) / scoreData.length;
    const strongestSubject = scoreData[0]; // sudah diurutkan DESC
    const weakestSubject = scoreData[scoreData.length - 1];

    let status = 'good';
    let insights = [];
    let recommendations = [];

    // Analisis status keseluruhan
    if (averageScore >= 90) {
        status = 'excellent';
        insights.push(`Performa akademik sangat excellent dengan rata-rata ${averageScore.toFixed(1)}`);
    } else if (averageScore >= 80) {
        status = 'good';
        insights.push(`Performa akademik baik dengan rata-rata ${averageScore.toFixed(1)}`);
    } else if (averageScore >= 70) {
        status = 'needs_improvement';
        insights.push(`Performa akademik perlu ditingkatkan dengan rata-rata ${averageScore.toFixed(1)}`);
    } else {
        status = 'concerning';
        insights.push(`Performa akademik memerlukan perhatian serius dengan rata-rata ${averageScore.toFixed(1)}`);
    }

    // Analisis mata pelajaran terkuat dan terlemah
    if (scoreData.length > 1) {
        insights.push(`Mata pelajaran terkuat: ${strongestSubject.subject_name} (${strongestSubject.average_score})`);
        insights.push(`Mata pelajaran yang perlu fokus: ${weakestSubject.subject_name} (${weakestSubject.average_score})`);

        if (parseFloat(weakestSubject.average_score) < 75) {
            recommendations.push({
                title: `Tingkatkan Nilai ${weakestSubject.subject_name}`,
                description: `Fokus lebih pada ${weakestSubject.subject_name} dengan belajar rutin dan bertanya pada guru`,
                priority: 'high',
                subject: weakestSubject.subject_name
            });
        }
    }

    // Rekomendasi umum
    if (averageScore < 80) {
        recommendations.push({
            title: 'Tingkatkan Konsistensi Belajar',
            description: 'Buat jadwal belajar rutin dan kerjakan semua tugas dengan teliti',
            priority: averageScore < 70 ? 'high' : 'medium'
        });
    } else {
        recommendations.push({
            title: 'Pertahankan Prestasi',
            description: 'Terus pertahankan performa yang sudah baik dan tantang diri dengan soal yang lebih sulit',
            priority: 'medium'
        });
    }

    return {
        status,
        summary: `Rata-rata nilai ${averageScore.toFixed(1)} dari ${scoreData.length} mata pelajaran`,
        insights,
        recommendations,
        academic_analysis: {
            strongest_subject: strongestSubject.subject_name,
            weakest_subject: weakestSubject.subject_name,
            overall_performance: `Performa ${status} dengan ${scoreData.reduce((sum, item) => sum + parseInt(item.total_assignments), 0)} tugas selesai`,
            consistency_level: averageScore >= 85 ? 'tinggi' : averageScore >= 75 ? 'sedang' : 'rendah'
        }
    };
}

module.exports = router;