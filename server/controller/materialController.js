const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

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

// Helper function untuk validasi kepemilikan material
const validateMaterialOwnership = async (materialId, teacherId) => {
    const result = await pool.query(
        'SELECT m.id FROM materials m JOIN classes c ON m.class_id = c.id WHERE m.id = $1 AND c.teacher_id = $2',
        [materialId, teacherId]
    );
    return result.rows.length > 0;
};

// Helper function untuk format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function untuk get file info
const getFileInfo = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            return {
                size: stats.size,
                formattedSize: formatFileSize(stats.size),
                exists: true
            };
        }
        return { exists: false };
    } catch (error) {
        return { exists: false };
    }
};

// Guru: Membuat material baru
exports.createMaterial = async (req, res) => {
    const { classId } = req.params;
    const { title, description, file_type } = req.body;
    const teacherId = req.user.id;

    // Validasi input
    if (!title || !description) {
        return res.status(400).json({
            success: false,
            message: 'Judul dan deskripsi materi wajib diisi.'
        });
    }

    try {
        // Validasi kepemilikan kelas
        const isOwner = await validateClassOwnership(classId, teacherId);
        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk membuat materi di kelas ini.'
            });
        }

        // Handle file upload jika ada
        let fileUrl = null;
        let fileSize = null;
        let formattedFileSize = null;

        if (req.file) {
            // File path relatif untuk disimpan ke database
            fileUrl = `uploads/materials/${req.file.filename}`;

            // Get file size info
            const fileInfo = getFileInfo(req.file.path);
            if (fileInfo.exists) {
                fileSize = fileInfo.size;
                formattedFileSize = fileInfo.formattedSize;
            }
        }

        // Insert material ke database
        const result = await pool.query(
            `INSERT INTO materials (class_id, teacher_id, title, description, file_url, file_type, file_size, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [classId, teacherId, title, description, fileUrl, file_type || 'other', formattedFileSize, 'active']
        );

        // Get class info untuk response
        const classInfo = await pool.query(
            'SELECT name FROM classes WHERE id = $1',
            [classId]
        );

        res.status(201).json({
            success: true,
            message: 'Materi berhasil dibuat',
            material: {
                ...result.rows[0],
                class_name: classInfo.rows[0]?.name
            }
        });
    } catch (error) {
        console.error('Error creating material:', error);

        // Hapus file yang sudah diupload jika terjadi error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat membuat materi.'
        });
    }
};

// Guru: Mendapatkan semua materials dari kelas yang diajar
exports.getMaterialsByTeacher = async (req, res) => {
    const teacherId = req.user.id;
    const { classId } = req.query; // Optional filter by class

    try {
        let query = `
            SELECT 
                m.*,
                c.name as class_name,
                c.grade as class_grade
            FROM materials m
            JOIN classes c ON m.class_id = c.id
            WHERE c.teacher_id = $1 AND m.status = 'active'
        `;

        const params = [teacherId];

        if (classId) {
            query += ' AND m.class_id = $2';
            params.push(classId);
        }

        query += ' ORDER BY m.uploaded_at DESC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            materials: result.rows
        });
    } catch (error) {
        console.error('Error fetching materials by teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengambil daftar materi.'
        });
    }
};

// Siswa: Mendapatkan materials dari kelas yang diikuti
exports.getMaterialsByStudent = async (req, res) => {
    const studentId = req.user.id;
    const { classId } = req.query; // Optional filter by class

    try {
        let query = `
            SELECT 
                m.*,
                c.name as class_name,
                c.grade as class_grade,
                g.nama_lengkap as teacher_name
            FROM materials m
            JOIN classes c ON m.class_id = c.id
            JOIN class_members cm ON c.id = cm.class_id
            JOIN guru g ON c.teacher_id = g.user_id
            WHERE cm.user_id = $1 AND m.status = 'active'
        `;

        const params = [studentId];

        if (classId) {
            query += ' AND m.class_id = $2';
            params.push(classId);
        }

        query += ' ORDER BY m.uploaded_at DESC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            materials: result.rows
        });
    } catch (error) {
        console.error('Error fetching materials by student:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengambil daftar materi.'
        });
    }
};

// Get material by ID (untuk guru dan siswa yang terkait)
exports.getMaterialById = async (req, res) => {
    const { materialId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const materialQuery = `
            SELECT 
                m.*,
                c.name as class_name,
                c.grade as class_grade,
                g.nama_lengkap as teacher_name,
                u.email as teacher_email
            FROM materials m
            JOIN classes c ON m.class_id = c.id
            JOIN guru g ON c.teacher_id = g.user_id
            JOIN users u ON g.user_id = u.id
            WHERE m.id = $1 AND m.status = 'active'
        `;

        const materialResult = await pool.query(materialQuery, [materialId]);

        if (materialResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Materi tidak ditemukan.'
            });
        }

        const material = materialResult.rows[0];

        // Validasi akses berdasarkan role
        if (userRole === 'guru') {
            // Guru harus pemilik kelas
            const isOwner = await validateMaterialOwnership(materialId, userId);
            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki akses ke materi ini.'
                });
            }
        } else if (userRole === 'siswa') {
            // Siswa harus anggota kelas
            const memberCheck = await pool.query(
                'SELECT id FROM class_members WHERE class_id = $1 AND user_id = $2',
                [material.class_id, userId]
            );
            if (memberCheck.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Anda tidak memiliki akses ke materi ini.'
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak.'
            });
        }

        // Format file URL menjadi full URL jika ada
        if (material.file_url && !material.file_url.startsWith('http')) {
            material.file_url = `${req.protocol}://${req.get('host')}/${material.file_url}`;
        }

        res.json({
            success: true,
            material
        });
    } catch (error) {
        console.error('Error fetching material by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengambil detail materi.'
        });
    }
};

// Guru: Update material
exports.updateMaterial = async (req, res) => {
    const { materialId } = req.params;
    const { title, description, file_type, status } = req.body;
    const teacherId = req.user.id;

    try {
        // Validasi kepemilikan material
        const isOwner = await validateMaterialOwnership(materialId, teacherId);
        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk mengubah materi ini.'
            });
        }

        // Get current material info
        const currentMaterial = await pool.query(
            'SELECT file_url FROM materials WHERE id = $1',
            [materialId]
        );

        if (currentMaterial.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Materi tidak ditemukan.'
            });
        }

        // Handle file upload jika ada file baru
        let fileUrl = currentMaterial.rows[0].file_url;
        let fileSize = null;
        let formattedFileSize = null;

        if (req.file) {
            // Hapus file lama jika ada
            if (fileUrl && !fileUrl.startsWith('http')) {
                const oldFilePath = path.join(__dirname, '..', fileUrl);
                try {
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                } catch (error) {
                    console.error('Error deleting old file:', error);
                }
            }

            // Set file baru
            fileUrl = `uploads/materials/${req.file.filename}`;

            // Get file size info
            const fileInfo = getFileInfo(req.file.path);
            if (fileInfo.exists) {
                fileSize = fileInfo.size;
                formattedFileSize = fileInfo.formattedSize;
            }
        }

        // Build update query dinamis
        const updates = [];
        const values = [];
        let paramCount = 0;

        if (title !== undefined) {
            updates.push(`title = ${++paramCount}`);
            values.push(title);
        }
        if (description !== undefined) {
            updates.push(`description = ${++paramCount}`);
            values.push(description);
        }
        if (file_type !== undefined) {
            updates.push(`file_type = ${++paramCount}`);
            values.push(file_type);
        }
        if (status !== undefined) {
            updates.push(`status = ${++paramCount}`);
            values.push(status);
        }
        if (req.file) {
            updates.push(`file_url = ${++paramCount}`);
            values.push(fileUrl);
            updates.push(`file_size = ${++paramCount}`);
            values.push(formattedFileSize);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada data yang akan diubah.'
            });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(materialId);

        const query = `
            UPDATE materials 
            SET ${updates.join(', ')} 
            WHERE id = ${++paramCount} 
            RETURNING *
        `;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Materi berhasil diperbarui',
            material: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating material:', error);

        // Hapus file yang sudah diupload jika terjadi error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat memperbarui materi.'
        });
    }
};

// Guru: Delete material
exports.deleteMaterial = async (req, res) => {
    const { materialId } = req.params;
    const teacherId = req.user.id;

    try {
        // Validasi kepemilikan material
        const isOwner = await validateMaterialOwnership(materialId, teacherId);
        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki izin untuk menghapus materi ini.'
            });
        }

        // Get material info untuk hapus file
        const materialInfo = await pool.query(
            'SELECT title, file_url FROM materials WHERE id = $1',
            [materialId]
        );

        if (materialInfo.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Materi tidak ditemukan.'
            });
        }

        const material = materialInfo.rows[0];

        // Soft delete - ubah status menjadi inactive
        await pool.query(
            'UPDATE materials SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['inactive', materialId]
        );

        // Optional: Hapus file fisik jika ingin hard delete
        // if (material.file_url && !material.file_url.startsWith('http')) {
        //     const filePath = path.join(__dirname, '..', material.file_url);
        //     try {
        //         if (fs.existsSync(filePath)) {
        //             fs.unlinkSync(filePath);
        //         }
        //     } catch (error) {
        //         console.error('Error deleting file:', error);
        //     }
        // }

        res.json({
            success: true,
            message: `Materi "${material.title}" berhasil dihapus`
        });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat menghapus materi.'
        });
    }
};

// Get materials by class ID (untuk UI kelas detail)
exports.getMaterialsByClass = async (req, res) => {
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

        const result = await pool.query(`
            SELECT 
                m.*,
                g.nama_lengkap as teacher_name
            FROM materials m
            JOIN classes c ON m.class_id = c.id
            JOIN guru g ON c.teacher_id = g.user_id
            WHERE m.class_id = $1 AND m.status = 'active'
            ORDER BY m.uploaded_at DESC
        `, [classId]);

        // Format file URLs menjadi full URLs
        const materials = result.rows.map(material => {
            if (material.file_url && !material.file_url.startsWith('http')) {
                material.file_url = `${req.protocol}://${req.get('host')}/${material.file_url}`;
            }
            return material;
        });

        res.json({
            success: true,
            materials
        });
    } catch (error) {
        console.error('Error fetching materials by class:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat mengambil daftar materi.'
        });
    }
};

// Download material file
exports.downloadMaterial = async (req, res) => {
    const { materialId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Get material info
        const materialResult = await pool.query(`
            SELECT 
                m.*,
                c.teacher_id
            FROM materials m
            JOIN classes c ON m.class_id = c.id
            WHERE m.id = $1 AND m.status = 'active'
        `, [materialId]);

        if (materialResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Materi tidak ditemukan.'
            });
        }

        const material = materialResult.rows[0];

        // Validasi akses
        let hasAccess = false;
        if (userRole === 'guru' && material.teacher_id === userId) {
            hasAccess = true;
        } else if (userRole === 'siswa') {
            const memberCheck = await pool.query(
                'SELECT id FROM class_members WHERE class_id = $1 AND user_id = $2',
                [material.class_id, userId]
            );
            hasAccess = memberCheck.rows.length > 0;
        }

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses untuk mengunduh materi ini.'
            });
        }

        // Check if file exists
        if (!material.file_url) {
            return res.status(404).json({
                success: false,
                message: 'File materi tidak tersedia.'
            });
        }

        const filePath = path.join(__dirname, '..', material.file_url);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan di server.'
            });
        }

        // Set headers untuk download
        const fileName = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Stream file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Terjadi kesalahan saat mengunduh file.'
                });
            }
        });

    } catch (error) {
        console.error('Error downloading material:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server saat mengunduh materi.'
            });
        }
    }
};