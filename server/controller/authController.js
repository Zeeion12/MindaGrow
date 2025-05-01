const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log('Received registration request:', req.body);
    
    // Validasi request
    if (!req.body.userType) {
      return res.status(400).json({
        success: false,
        message: 'Tipe pengguna tidak diberikan'
      });
    }
    
    const { userType, ...userData } = req.body;
    let table, idField;
    
    // Determine which table to use based on user type
    switch (userType) {
      case 'siswa':
        table = 'siswa';
        idField = 'nis';
        break;
      case 'orangtua':
        table = 'orangtua';
        idField = 'nik';
        break;
      case 'guru':
        table = 'guru';
        idField = 'nuptk';
        break;
      default:
        console.log('Invalid user type:', userType);
        return res.status(400).json({
          success: false,
          message: 'Tipe pengguna tidak valid',
        });
    }
    
    console.log(`Using table: ${table}, ID field: ${idField}`);
    
    // Pastikan ID field ada di userData
    if (!userData[idField]) {
      return res.status(400).json({
        success: false,
        message: `${idField} tidak diberikan`
      });
    }
    
    // Pastikan nama lengkap ada
    if (!userData.namaLengkap) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap tidak diberikan'
      });
    }
    
    // Pastikan password ada
    if (!userData.password) {
      return res.status(400).json({
        success: false,
        message: 'Password tidak diberikan'
      });
    }
    
    // Periksa apakah tabel ada di database
    try {
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `;
      const tableExists = await db.query(tableExistsQuery, [table]);
      
      if (!tableExists.rows[0].exists) {
        console.error(`Table ${table} does not exist`);
        return res.status(500).json({
          success: false,
          message: `Terjadi kesalahan pada konfigurasi database. Tabel ${table} tidak ditemukan.`
        });
      }
    } catch (tableError) {
      console.error('Error checking table existence:', tableError);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memeriksa struktur database'
      });
    }
    
    // Check if user already exists
    console.log(`Checking if ${idField}: ${userData[idField]} exists in ${table}`);
    
    try {
      const userCheckQuery = `SELECT * FROM ${table} WHERE ${idField} = $1`;
      const existingUser = await db.query(userCheckQuery, [userData[idField]]);
      
      if (existingUser.rows.length > 0) {
        console.log(`User with ${idField}: ${userData[idField]} already exists`);
        return res.status(400).json({
          success: false,
          message: `${userType} dengan ${idField} tersebut sudah terdaftar`,
        });
      }
    } catch (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memeriksa pengguna yang sudah ada'
      });
    }
    
    // Email uniqueness check across all tables
    try {
      console.log(`Checking if email: ${userData.surel} exists in any table`);
      const emailCheckQueries = [
        'SELECT surel FROM siswa WHERE surel = $1',
        'SELECT surel FROM orangtua WHERE surel = $1',
        'SELECT surel FROM guru WHERE surel = $1'
      ];
      
      for (const query of emailCheckQueries) {
        const result = await db.query(query, [userData.surel]);
        if (result.rows.length > 0) {
          console.log(`Email ${userData.surel} already exists in database`);
          return res.status(400).json({
            success: false,
            message: 'Email sudah digunakan oleh pengguna lain',
          });
        }
      }
    } catch (emailError) {
      console.error('Error checking email uniqueness:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memeriksa keunikan email'
      });
    }
    
    // Hash the password
    let passwordHash;
    try {
      console.log('Hashing password...');
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(userData.password, saltRounds);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengamankan password'
      });
    }
    
    try {
      // Create field list and value placeholders for the query
      // Nama field harus sesuai dengan struktur database
      const fieldMapping = {
        namaLengkap: 'name_lengkap',
        noTelepon: 'no_telepon',
        surel: 'surel',
        gender: 'gender',
        nis: 'nis',
        nik: 'nik',
        nuptk: 'nuptk',
        kelas: 'kelas'
      };
      
      // Dapatkan nama field yang benar dari userData
      const fields = [];
      const values = [];
      const placeholders = [];
      let paramIndex = 1;
      
      // Tambahkan field yang ada di userData, mapping ke nama kolom yang benar
      Object.keys(userData).forEach(key => {
        if (key !== 'password' && key !== 'konfirmasiPassword' && key !== 'persetujuan') {
          const dbFieldName = fieldMapping[key] || key;
          fields.push(dbFieldName);
          values.push(userData[key]);
          placeholders.push(`$${paramIndex++}`);
        }
      });
      
      // Tambahkan password_hash
      fields.push('password_hash');
      values.push(passwordHash);
      placeholders.push(`$${paramIndex}`);
      
      console.log('Preparing SQL query with fields:', fields.join(', '));
      
      // Insert user into the database
      const insertQuery = `
        INSERT INTO ${table} (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      console.log('Executing SQL query...');
      const insertResult = await db.query(insertQuery, values);
      console.log('User registered successfully:', insertResult.rows[0][idField]);
      
      return res.status(201).json({
        success: true,
        message: 'Registrasi berhasil, silahkan login',
      });
    } catch (insertError) {
      console.error('Error inserting user:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menyimpan data pengguna',
        error: process.env.NODE_ENV === 'development' ? insertError.message : undefined,
      });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat registrasi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    console.log('Received login request:', { username: req.body.username });
    const { username, password } = req.body;
    
    // Check all user tables for the username (which could be nis, nik, or nuptk)
    const queryChecks = [
      { table: 'siswa', idField: 'nis' },
      { table: 'orangtua', idField: 'nik' },
      { table: 'guru', idField: 'nuptk' }
    ];
    
    let user = null;
    let userType = null;
    let userTable = null;
    
    for (const check of queryChecks) {
      const query = `SELECT * FROM ${check.table} WHERE ${check.idField} = $1`;
      const result = await db.query(query, [username]);
      
      if (result.rows.length > 0) {
        user = result.rows[0];
        userType = check.table;
        userTable = check.table;
        console.log(`Found user in ${check.table} table by ${check.idField}`);
        break;
      }
    }
    
    // If no user found with the ID, check for email
    if (!user) {
      console.log('No user found by ID, checking by email');
      for (const check of queryChecks) {
        const query = `SELECT * FROM ${check.table} WHERE surel = $1`;
        const result = await db.query(query, [username]);
        
        if (result.rows.length > 0) {
          user = result.rows[0];
          userType = check.table;
          userTable = check.table;
          console.log(`Found user in ${check.table} table by email`);
          break;
        }
      }
    }
    
    if (!user) {
      console.log('No user found with provided username/email');
      return res.status(401).json({
        success: false,
        message: 'Username/email atau password salah',
      });
    }
    
    // Compare password
    console.log('Comparing passwords...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Username/email atau password salah',
      });
    }
    
    // Generate JWT token
    console.log('Generating JWT token...');
    const payload = {
      id: user.nis || user.nik || user.nuptk,
      userType,
      name: user.name_lengkap,
      email: user.surel
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Don't send password hash in response
    delete user.password_hash;
    
    console.log('Login successful for user:', payload.id);
    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        ...user,
        userType
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Check authentication status
exports.checkStatus = async (req, res) => {
  try {
    // User is already authenticated via the middleware
    console.log('Checking auth status for user:', req.user.nis || req.user.nik || req.user.nuptk);
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memeriksa status autentikasi'
    });
  }
};