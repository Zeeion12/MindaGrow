-- Create tables if they don't exist

-- Create siswa table
CREATE TABLE IF NOT EXISTS siswa (
  nis VARCHAR(50) PRIMARY KEY,
  name_lengkap VARCHAR(100) NOT NULL,
  no_telepon VARCHAR(20),
  surel VARCHAR(100),
  gender VARCHAR(10),
  password_hash VARCHAR(255) NOT NULL,
  kelas VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orangtua table
CREATE TABLE IF NOT EXISTS orangtua (
  nik VARCHAR(16) PRIMARY KEY,
  name_lengkap VARCHAR(100) NOT NULL,
  no_telepon VARCHAR(20),
  surel VARCHAR(100),
  gender VARCHAR(10),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create guru table
CREATE TABLE IF NOT EXISTS guru (
  nuptk VARCHAR(20) PRIMARY KEY,
  name_lengkap VARCHAR(100) NOT NULL,
  no_telepon VARCHAR(20),
  surel VARCHAR(100),
  gender VARCHAR(10),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);