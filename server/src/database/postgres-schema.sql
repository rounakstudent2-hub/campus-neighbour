-- PostgreSQL Schema Migration for Neighborhood Student Help Marketplace

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(32) NOT NULL CHECK(role IN ('neighbor', 'student', 'admin')),
  avatar_url TEXT,
  address TEXT,
  locality VARCHAR(255),
  city VARCHAR(255) DEFAULT 'Bengaluru',
  state VARCHAR(255) DEFAULT 'Karnataka',
  pincode VARCHAR(20),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_verified SMALLINT DEFAULT 1,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  college_name VARCHAR(255),
  education_level VARCHAR(255),
  skills TEXT DEFAULT '[]',
  working_radius_km DOUBLE PRECISION DEFAULT 5.0,
  is_guardian_approved SMALLINT DEFAULT 1,
  is_available SMALLINT DEFAULT 1,
  total_tasks_completed INT DEFAULT 0,
  total_earnings DOUBLE PRECISION DEFAULT 0.0,
  average_rating DOUBLE PRECISION DEFAULT 5.0,
  ratings_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  default_address TEXT,
  total_tasks_posted INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(64),
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id VARCHAR(64) NOT NULL REFERENCES task_categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget DOUBLE PRECISION NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  address TEXT NOT NULL,
  locality VARCHAR(255) NOT NULL,
  city VARCHAR(255) DEFAULT 'Bengaluru',
  pincode VARCHAR(20),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'Applied', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'Disputed')),
  assigned_student_id VARCHAR(64) REFERENCES users(id),
  completion_proof TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(64) PRIMARY KEY,
  task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_fee DOUBLE PRECISION NOT NULL,
  pitch_note TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Accepted', 'Rejected', 'Withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, student_id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(64) PRIMARY KEY,
  task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreed_fee DOUBLE PRECISION NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'Assigned'
);

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(64) PRIMARY KEY,
  task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  customer_id VARCHAR(64) NOT NULL REFERENCES users(id),
  student_id VARCHAR(64) NOT NULL REFERENCES users(id),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, customer_id, student_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(64) NOT NULL REFERENCES users(id),
  message_text TEXT NOT NULL,
  is_read SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  task_id VARCHAR(64) NOT NULL REFERENCES tasks(id),
  customer_id VARCHAR(64) NOT NULL REFERENCES users(id),
  student_id VARCHAR(64) REFERENCES users(id),
  amount DOUBLE PRECISION NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'escrow_held', 'released', 'refunded', 'failed')),
  payment_gateway VARCHAR(64) DEFAULT 'Razorpay',
  gateway_order_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  transaction_type VARCHAR(32) NOT NULL DEFAULT 'escrow_hold',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) PRIMARY KEY,
  task_id VARCHAR(64) NOT NULL REFERENCES tasks(id),
  reviewer_id VARCHAR(64) NOT NULL REFERENCES users(id),
  reviewee_id VARCHAR(64) NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  is_moderated SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(64) NOT NULL,
  link_url TEXT,
  is_read SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(64) PRIMARY KEY,
  reporter_id VARCHAR(64) NOT NULL REFERENCES users(id),
  reported_user_id VARCHAR(64) REFERENCES users(id),
  task_id VARCHAR(64) REFERENCES tasks(id),
  reason VARCHAR(255) NOT NULL,
  details TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ
);
