-- PillSync Database Schema
-- Milestone 1 (Strict Infosys Springboard Scope)

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for quick auth lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Create Patient Profiles Table
CREATE TABLE IF NOT EXISTS patient_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    age INTEGER,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    address TEXT,
    emergency_contact VARCHAR(100),
    account_status VARCHAR(20) DEFAULT 'Active'
);

-- 4. Create Caregiver Profiles Table
CREATE TABLE IF NOT EXISTS caregiver_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    age INTEGER,
    gender VARCHAR(20),
    address TEXT,
    account_status VARCHAR(20) DEFAULT 'Active'
);

-- Seed Default Roles
INSERT INTO roles (id, name) 
VALUES 
    (1, 'admin'),
    (2, 'patient'),
    (3, 'caregiver')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Admin Account (hashed_password is for password 'admin123' using bcrypt)
-- Note: In FastAPI startup, we will also ensure this exists and hash it properly dynamically.
INSERT INTO users (id, email, hashed_password, role_id, is_active)
VALUES (1, 'admin@pillsync.com', '$2b$12$7kP.yG83aK40rJb3xVd5e.i29WzT7lBqT3iO.a0z6p9z13v1n2n2y', 1, TRUE)
ON CONFLICT (id) DO NOTHING;
