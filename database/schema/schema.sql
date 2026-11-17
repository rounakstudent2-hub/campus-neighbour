-- ========================================================
-- CampusNeighbor Hyperlocal Marketplace Relational Schema
-- Engine: PostgreSQL 15+ (Compatible with SQLite Dual-Engine)
-- ========================================================

-- Enable UUID extension if on PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('neighbor', 'student', 'admin')),
    college VARCHAR(200),
    avatar VARCHAR(500),
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    creator_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    budget DOUBLE PRECISION NOT NULL CHECK (budget > 0),
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    address VARCHAR(300) NOT NULL,
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
    assigned_to VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_lat_lon ON tasks(lat, lon);

-- 3. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    proposed_fee DOUBLE PRECISION NOT NULL CHECK (proposed_fee > 0),
    pitch TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'applied' CHECK (status IN ('applied', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_task_student_application UNIQUE (task_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_task_id ON applications(task_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);

-- 4. Escrow Payments Table
CREATE TABLE IF NOT EXISTS escrow_payments (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    payer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payee_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL CHECK (amount > 0),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'escrow_held', 'released', 'refunded')),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_escrow_task_id ON escrow_payments(task_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payer_id ON escrow_payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payee_id ON escrow_payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_payments(status);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);

-- 6. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);

-- 7. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    reporter_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    task_id VARCHAR(36) REFERENCES tasks(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
