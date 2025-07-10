const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth Profile:', profile);

    // Cek apakah user sudah ada berdasarkan Google ID
    let userResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (userResult.rows.length > 0) {
      // User sudah ada, return user
      return done(null, userResult.rows[0]);
    }

    // Cek apakah email sudah terdaftar dengan metode lain
    userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [profile.emails[0].value]
    );

    if (userResult.rows.length > 0) {
      // Email sudah ada, link akun Google ke akun existing
      await pool.query(
        'UPDATE users SET google_id = $1, oauth_provider = $2, is_email_verified = $3, avatar_url = $4 WHERE email = $5',
        [profile.id, 'google', true, profile.photos[0].value, profile.emails[0].value]
      );
      
      const updatedUser = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [profile.emails[0].value]
      );
      
      return done(null, updatedUser.rows[0]);
    }

    // User baru, buat akun baru
    const randomPassword = require('crypto').randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUserResult = await pool.query(
      'INSERT INTO users (email, password, google_id, oauth_provider, is_email_verified, avatar_url, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        profile.emails[0].value,
        hashedPassword,
        profile.id,
        'google',
        true,
        profile.photos[0].value,
        'siswa' // Default role
      ]
    );

    return done(null, newUserResult.rows[0]);

  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, userResult.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;