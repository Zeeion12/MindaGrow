const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { generateParentInsights, generateSimpleParentInsights } = require('../services/parentInsightsService');
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

// Get parent insights for specific child
router.get('/parent-insights/:childId', authenticateToken, async (req, res) => {
    try {
        const { childId } = req.params;
        const parentUserId = req.user.id;

        console.log(`Fetching parent insights for child ${childId}, parent ${parentUserId}`);

        // Verify that this child belongs to the logged-in parent
        const parentResult = await pool.query(
            'SELECT nik FROM orangtua WHERE user_id = $1',
            [parentUserId]
        );

        if (parentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parent data not found'
            });
        }

        const parentNik = parentResult.rows[0].nik;

        // Validate child ownership
        const childValidation = await pool.query(
            'SELECT s.user_id, s.nama_lengkap, s.nis FROM siswa s WHERE s.user_id = $1 AND s.nik_orangtua = $2',
            [childId, parentNik]
        );

        if (childValidation.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this child data'
            });
        }

        const childData = childValidation.rows[0];

        // Get child's recent activities (last 30 days)
        const activitiesQuery = `
            SELECT 
                s.id,
                s.score,
                s.feedback,
                s.status,
                s.submitted_at,
                s.graded_at,
                a.title as assignment_title,
                c.name as class_name,
                c.name as course,
                CONCAT('Tugas "', a.title, '" - ', c.name) as description,
                a.due_date,
                CASE 
                    WHEN s.status = 'graded' THEN 'assignment_graded'
                    WHEN s.status = 'submitted' THEN 'assignment_submitted'
                    ELSE 'assignment_pending'
                END as type
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN classes c ON a.class_id = c.id
            WHERE s.student_id = $1 
                AND s.submitted_at >= NOW() - INTERVAL '30 days'
            ORDER BY s.submitted_at DESC
            LIMIT 20
        `;

        const activitiesResult = await pool.query(activitiesQuery, [childId]);
        const activitiesData = activitiesResult.rows;

        // Get performance statistics
        const performanceQuery = `
            SELECT 
                COUNT(DISTINCT c.id) as total_classes,
                COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_classes,
                COUNT(s.id) as total_assignments,
                COUNT(CASE WHEN s.status = 'graded' THEN s.id END) as completed_assignments,
                COUNT(CASE WHEN s.status = 'submitted' THEN s.id END) as pending_assignments,
                CAST(ROUND(CAST(AVG(s.score) AS NUMERIC), 2) AS FLOAT) as average_score,
                CAST(ROUND(
                    CAST((COUNT(CASE WHEN s.status IN ('graded', 'submitted') THEN s.id END)::float / 
                     NULLIF(COUNT(a.id), 0)) * 100 AS NUMERIC), 2
                ) AS FLOAT) as submission_rate
            FROM class_members cm
            JOIN classes c ON cm.class_id = c.id
            LEFT JOIN assignments a ON c.id = a.class_id
            LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
            WHERE cm.user_id = $1 AND cm.status = 'active'
        `;

        const performanceResult = await pool.query(performanceQuery, [childId]);
        const performanceData = performanceResult.rows[0] || {};

        // Get recent score trends (last 10 graded assignments)
        const trendsQuery = `
            SELECT 
                s.score,
                s.graded_at,
                a.title,
                c.name as subject
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            JOIN classes c ON a.class_id = c.id
            WHERE s.student_id = $1 
                AND s.status = 'graded' 
                AND s.score IS NOT NULL
            ORDER BY s.graded_at DESC
            LIMIT 10
        `;

        const trendsResult = await pool.query(trendsQuery, [childId]);
        const trendsData = trendsResult.rows;

        // Add trend analysis to performance data
        if (trendsData.length >= 3) {
            const recentScores = trendsData.slice(0, 3).map(t => t.score);
            const olderScores = trendsData.slice(-3).map(t => t.score);
            const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
            const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

            performanceData.trend_direction = recentAvg > olderAvg ? 'improving' :
                recentAvg < olderAvg ? 'declining' : 'stable';
            performanceData.recent_average = recentAvg;
            performanceData.trend_scores = trendsData.map(t => t.score);
        }

        console.log(`Found ${activitiesData.length} activities and performance data`);

        // Generate AI insights
        let insights = null;
        if (activitiesData.length > 0 || Object.keys(performanceData).length > 0) {
            try {
                console.log('Generating AI parent insights...');
                insights = await generateParentInsights(childData, activitiesData, performanceData);
                console.log('AI parent insights generated successfully');
            } catch (error) {
                console.error('AI parent insights generation failed:', error);
                // Return simple rule-based insights as fallback
                insights = generateSimpleParentInsights(childData, activitiesData, performanceData);
                console.log('Using fallback rule-based parent insights');
            }
        } else {
            // Generate simple insights for no data scenario
            insights = generateSimpleParentInsights(childData, activitiesData, performanceData);
            console.log('Using simple parent insights for no-data scenario');
        }

        res.json({
            success: true,
            data: {
                childData,
                insights,
                activitiesData,
                performanceData,
                trendsData: trendsData.slice(0, 5) // Last 5 scores for chart
            }
        });

    } catch (error) {
        console.error('Error fetching parent insights:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch parent insights: ' + error.message
        });
    }
});

// Get quick summary for all children
router.get('/parent-dashboard-summary', authenticateToken, async (req, res) => {
    try {
        const parentUserId = req.user.id;

        // Get parent data
        const parentResult = await pool.query(
            'SELECT nik FROM orangtua WHERE user_id = $1',
            [parentUserId]
        );

        if (parentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parent data not found'
            });
        }

        const parentNik = parentResult.rows[0].nik;

        // Get quick summary for all children
        const childrenQuery = `
            SELECT 
                s.user_id,
                s.nama_lengkap,
                s.nis,
                COUNT(DISTINCT cm.class_id) as total_classes,
                COUNT(DISTINCT sub.id) as total_submissions,
                COUNT(DISTINCT CASE WHEN sub.status = 'submitted' THEN sub.id END) as pending_grading,
                CAST(ROUND(CAST(AVG(sub.score) AS NUMERIC), 1) AS FLOAT) as average_score,
                MAX(sub.submitted_at) as last_activity
            FROM siswa s
            LEFT JOIN class_members cm ON s.user_id = cm.user_id AND cm.status = 'active'
            LEFT JOIN classes c ON cm.class_id = c.id
            LEFT JOIN assignments a ON c.id = a.class_id
            LEFT JOIN submissions sub ON a.id = sub.assignment_id AND sub.student_id = s.user_id
            WHERE s.nik_orangtua = $1
            GROUP BY s.user_id, s.nama_lengkap, s.nis
            ORDER BY s.nama_lengkap
        `;

        const childrenResult = await pool.query(childrenQuery, [parentNik]);
        const childrenSummary = childrenResult.rows.map(child => ({
            ...child,
            status: child.average_score >= 80 ? 'excellent' :
                child.average_score >= 70 ? 'good' :
                    child.average_score >= 60 ? 'needs_attention' : 'concerning',
            needs_attention: child.pending_grading > 0 || child.average_score < 70
        }));

        res.json({
            success: true,
            data: childrenSummary
        });

    } catch (error) {
        console.error('Error fetching parent dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard summary: ' + error.message
        });
    }
});

module.exports = router;