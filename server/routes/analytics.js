const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { generateLearningInsights } = require('../services/openaiService');
const { Pool } = require('pg');

// PostgreSQL connection - menggunakan konfigurasi yang sama dengan index.js
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'mindagrow',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

// Auth middleware - definisi lokal karena import bermasalah
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

// Get learning insights with AI analysis
router.get('/learning-insights', authenticateToken, async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        const userId = req.user.id;

        console.log(`Fetching learning insights for user ${userId}, year ${year}`);

        // FIXED: Menggunakan kolom yang benar dari tabel user_sessions
        const learningQuery = `
            WITH session_durations AS (
                SELECT
                    user_id,
                    EXTRACT(MONTH FROM created_at) as month_num,
                    created_at,
                    last_activity,
                    -- Calculate duration in minutes
                    EXTRACT(EPOCH FROM (
                        CASE
                            WHEN is_active = TRUE AND last_activity >= NOW() - INTERVAL '15 minutes'
                            THEN NOW() -- If session is active and recent, use current time
                            ELSE last_activity
                        END - created_at
                    )) / 60 AS duration_minutes
                FROM
                    user_sessions
                WHERE
                    user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2
                    AND last_activity IS NOT NULL
            ),
            monthly_data AS (
                SELECT
                    month_num,
                    SUM(duration_minutes) AS total_duration_minutes,
                    COUNT(DISTINCT DATE(created_at)) AS active_days_count
                FROM
                    session_durations
                GROUP BY
                    month_num
                ORDER BY
                    month_num
            )
            SELECT
                md.month_num,
                CASE
                    WHEN md.month_num = 1 THEN 'Jan'
                    WHEN md.month_num = 2 THEN 'Feb'
                    WHEN md.month_num = 3 THEN 'Mar'
                    WHEN md.month_num = 4 THEN 'Apr'
                    WHEN md.month_num = 5 THEN 'Mei'
                    WHEN md.month_num = 6 THEN 'Jun'
                    WHEN md.month_num = 7 THEN 'Jul'
                    WHEN md.month_num = 8 THEN 'Agu'
                    WHEN md.month_num = 9 THEN 'Sep'
                    WHEN md.month_num = 10 THEN 'Okt'
                    WHEN md.month_num = 11 THEN 'Nov'
                    WHEN md.month_num = 12 THEN 'Des'
                END as month,
                COALESCE(md.total_duration_minutes, 0) AS duration,
                COALESCE(ROUND(md.total_duration_minutes / NULLIF(md.active_days_count, 0)), 0) AS average
            FROM
                monthly_data md
            RIGHT JOIN
                generate_series(1, 12) AS s(month_num) ON md.month_num = s.month_num
            ORDER BY
                s.month_num;
        `;

        const learningResult = await pool.query(learningQuery, [userId, year]);
        const learningData = learningResult.rows;

        console.log(`Found ${learningData.length} months of data`);

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
        if (learningData.length > 0 && learningData.some(item => item.duration > 0)) {
            try {
                console.log('Generating AI insights...');
                insights = await generateLearningInsights(learningData, userProfile);
                console.log('AI insights generated successfully');
            } catch (error) {
                console.error('AI insights generation failed:', error);
                // Return simple rule-based insights as fallback
                insights = generateSimpleInsights(learningData, userProfile);
                console.log('Using fallback rule-based insights');
            }
        } else {
            // Generate simple insights even with no data
            insights = generateSimpleInsights(learningData, userProfile);
            console.log('Using simple insights for no-data scenario');
        }

        res.json({
            success: true,
            data: {
                learningData,
                insights,
                year: parseInt(year)
            }
        });

    } catch (error) {
        console.error('Error fetching learning insights:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch learning insights: ' + error.message
        });
    }
});

// Fallback function untuk generate simple insights jika OpenAI gagal
function generateSimpleInsights(learningData, userProfile) {
    const totalDuration = learningData.reduce((sum, item) => sum + item.duration, 0);
    const activeMonths = learningData.filter(item => item.duration > 0).length;
    const avgMonthly = activeMonths > 0 ? totalDuration / activeMonths : 0;

    let status = 'good';
    let insights = [];
    let recommendations = [];

    // Analisis konsistensi
    if (activeMonths < 6) {
        status = 'needs_improvement';
        insights.push(`Konsistensi belajar perlu ditingkatkan - hanya aktif ${activeMonths} bulan dalam tahun ini`);
        recommendations.push({
            title: 'Tingkatkan Konsistensi Belajar',
            description: 'Cobalah belajar minimal 30 menit setiap hari untuk membangun kebiasaan yang baik',
            priority: 'high'
        });
    } else {
        insights.push(`Konsistensi belajar cukup baik dengan ${activeMonths} bulan aktif`);
    }

    // Analisis durasi
    if (totalDuration > 1800) { // 30 jam per tahun
        status = 'excellent';
        insights.push(`Durasi belajar sangat baik dengan total ${Math.round(totalDuration / 60)} jam dalam tahun ini`);
    } else if (totalDuration < 600) { // kurang dari 10 jam per tahun
        status = 'concerning';
        insights.push('Durasi belajar masih kurang optimal');
        recommendations.push({
            title: 'Tingkatkan Durasi Belajar',
            description: 'Target minimal 15 jam belajar per bulan',
            priority: 'high'
        });
    } else {
        insights.push(`Total durasi belajar: ${Math.round(totalDuration / 60)} jam`);
    }

    // Rekomendasi umum
    if (recommendations.length === 0) {
        recommendations.push({
            title: 'Pertahankan Momentum',
            description: 'Terus pertahankan pola belajar yang sudah baik',
            priority: 'medium'
        });
    }

    return {
        status,
        summary: `Analisis ${activeMonths} bulan aktif dengan total ${Math.round(totalDuration / 60)} jam belajar`,
        insights,
        recommendations,
        trends: {
            direction: activeMonths > 6 ? 'stable' : 'irregular',
            description: `Pola belajar ${activeMonths > 6 ? 'cukup konsisten' : 'tidak teratur'} sepanjang tahun`
        }
    };
}

module.exports = router;