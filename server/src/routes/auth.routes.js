import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database/db.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

// Helper to decode and save base64 image data to disk
function saveBase64Avatar(userId, base64String) {
  if (!base64String || typeof base64String !== 'string') return null;
  // If it's already an HTTP URL or local static upload path, return as is
  if (base64String.startsWith('http://') || base64String.startsWith('https://') || base64String.startsWith('/api/uploads/')) {
    return base64String;
  }

  const matches = base64String.match(/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/);
  if (!matches) {
    return null;
  }

  let ext = matches[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'svg+xml') ext = 'svg';
  const base64Data = matches[2];

  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  const filename = `avatar-${userId}-${Date.now()}.${ext}`;
  const filePath = path.join(avatarsDir, filename);
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

  return `/api/uploads/avatars/${filename}`;
}

// Helper to deduce Indian state based on user locality, pincode, city, or coordinates
export function detectStateFromLocation({ locality = '', city = '', pincode = '', latitude, longitude, state } = {}) {
  if (state && typeof state === 'string' && state.trim().length > 0) {
    return state.trim();
  }

  const pin = (pincode || '').toString().trim();
  if (pin.length >= 2) {
    const p2 = parseInt(pin.substring(0, 2), 10);
    if (p2 === 11) return 'Delhi';
    if (p2 >= 12 && p2 <= 13) return 'Haryana';
    if (p2 >= 14 && p2 <= 16) return 'Punjab';
    if (p2 === 17) return 'Himachal Pradesh';
    if (p2 >= 18 && p2 <= 19) return 'Jammu and Kashmir';
    if (p2 >= 20 && p2 <= 28) return 'Uttar Pradesh';
    if (p2 >= 30 && p2 <= 34) return 'Rajasthan';
    if (p2 >= 36 && p2 <= 39) return 'Gujarat';
    if (p2 >= 40 && p2 <= 44) return 'Maharashtra';
    if (p2 >= 45 && p2 <= 49) return 'Madhya Pradesh';
    if (p2 >= 50 && p2 <= 53) return 'Telangana';
    if (p2 >= 56 && p2 <= 59) return 'Karnataka';
    if (p2 >= 60 && p2 <= 64) return 'Tamil Nadu';
    if (p2 >= 67 && p2 <= 69) return 'Kerala';
    if (p2 >= 70 && p2 <= 74) return 'West Bengal';
    if (p2 >= 75 && p2 <= 77) return 'Odisha';
    if (p2 === 78) return 'Assam';
    if (p2 >= 80 && p2 <= 85) return 'Bihar';
  }

  const text = `${locality} ${city}`.toLowerCase();
  if (
    text.includes('newtown') ||
    text.includes('new town') ||
    text.includes('rajarhat') ||
    text.includes('kolkata') ||
    text.includes('salt lake') ||
    text.includes('action area') ||
    text.includes('howrah') ||
    text.includes('durgapur') ||
    text.includes('siliguri')
  ) {
    return 'West Bengal';
  }
  if (
    text.includes('indiranagar') ||
    text.includes('koramangala') ||
    text.includes('hsr') ||
    text.includes('whitefield') ||
    text.includes('bengaluru') ||
    text.includes('bangalore') ||
    text.includes('mysore') ||
    text.includes('electronic city')
  ) {
    return 'Karnataka';
  }
  if (text.includes('mumbai') || text.includes('pune') || text.includes('thane') || text.includes('andheri') || text.includes('bandra')) {
    return 'Maharashtra';
  }
  if (text.includes('delhi') || text.includes('ncr') || text.includes('dwarka') || text.includes('connaught') || text.includes('hauz khas')) {
    return 'Delhi';
  }
  if (text.includes('gurgaon') || text.includes('gurugram') || text.includes('faridabad')) {
    return 'Haryana';
  }
  if (text.includes('noida') || text.includes('lucknow')) {
    return 'Uttar Pradesh';
  }
  if (text.includes('hyderabad') || text.includes('secunderabad') || text.includes('gachibowli') || text.includes('hitec')) {
    return 'Telangana';
  }
  if (text.includes('chennai') || text.includes('adyar') || text.includes('t nagar')) {
    return 'Tamil Nadu';
  }

  if (latitude && longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (lat >= 21.5 && lat <= 27.5 && lng >= 85.5 && lng <= 89.9) return 'West Bengal';
    if (lat >= 11.5 && lat <= 18.5 && lng >= 74.0 && lng <= 78.5) return 'Karnataka';
    if (lat >= 18.5 && lat <= 20.5 && lng >= 72.5 && lng <= 73.5) return 'Maharashtra';
    if (lat >= 28.3 && lat <= 28.9 && lng >= 76.8 && lng <= 77.4) return 'Delhi';
  }

  return 'Karnataka';
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      role,
      address,
      locality,
      city = 'Bengaluru',
      pincode,
      latitude,
      longitude,
      // Student specific
      collegeName,
      educationLevel,
      skills,
      workingRadiusKm = 5.0,
      isGuardianApproved = true,
      bio
    } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, full name, and role are required.' });
    }

    if (!['neighbor', 'student', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be neighbor, student, or admin.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check existing email
    const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    const now = new Date().toISOString();

    let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;
    if (req.body.imageData) {
      const saved = saveBase64Avatar(userId, req.body.imageData);
      if (saved) avatarUrl = saved;
    } else if (req.body.avatarUrl) {
      avatarUrl = req.body.avatarUrl.trim();
    }

    // Default coordinates if not provided (defaulting around Indiranagar / Koramangala Bengaluru for demo)
    const lat = latitude ? parseFloat(latitude) : (locality && locality.toLowerCase().includes('newtown') ? 22.5867 : 12.9716);
    const lng = longitude ? parseFloat(longitude) : (locality && locality.toLowerCase().includes('newtown') ? 88.4754 : 77.5946);

    const userState = detectStateFromLocation({ locality, city, pincode, latitude: lat, longitude: lng, state: req.body.state });

    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, avatar_url, address, locality, city, state, pincode, latitude, longitude, is_verified, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      [userId, email.trim().toLowerCase(), passwordHash, fullName.trim(), phone || '', role, avatarUrl, address || '', locality || '', city, userState, pincode || '', lat, lng, now, now]
    );

    // Create role-specific profile
    if (role === 'student') {
      const studentProfileId = uuidv4();
      const skillsArray = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify(skills ? skills.split(',').map(s => s.trim()) : ['General Tasks']);
      await db.run(
        `INSERT INTO student_profiles (id, user_id, bio, college_name, education_level, skills, working_radius_km, is_guardian_approved, is_available, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [studentProfileId, userId, bio || 'Enthusiastic student helper ready to assist neighbors with everyday tasks.', collegeName || 'Local University', educationLevel || 'Undergraduate', skillsArray, parseFloat(workingRadiusKm) || 5.0, isGuardianApproved ? 1 : 0, now]
      );
    } else if (role === 'neighbor') {
      const customerProfileId = uuidv4();
      await db.run(
        `INSERT INTO customer_profiles (id, user_id, bio, default_address, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [customerProfileId, userId, bio || 'Neighborhood resident looking for reliable local help.', address || '', now]
      );
    }

    const user = await db.get('SELECT id, email, full_name, role, phone, avatar_url, address, locality, city, state, pincode, latitude, longitude, is_verified FROM users WHERE id = ?', [userId]);
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await db.get(
      'SELECT id, email, password_hash, full_name, role, phone, avatar_url, address, locality, city, state, pincode, latitude, longitude, is_verified, is_active FROM users WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    delete user.password_hash;
    const token = generateToken(user);

    let profile = null;
    if (user.role === 'student') {
      profile = await db.get('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
      if (profile && profile.skills) {
        try { profile.skills = JSON.parse(profile.skills); } catch(e) {}
      }
    } else if (user.role === 'neighbor') {
      profile = await db.get('SELECT * FROM customer_profiles WHERE user_id = ?', [user.id]);
    }

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user,
      profile
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
});

// Get Current User Profile & stats
router.get('/me', requireAuth, async (req, res) => {
  try {
    let profile = null;
    if (req.user.role === 'student') {
      profile = await db.get('SELECT * FROM student_profiles WHERE user_id = ?', [req.user.id]);
      if (profile && profile.skills) {
        try { profile.skills = JSON.parse(profile.skills); } catch(e) {}
      }
    } else if (req.user.role === 'neighbor') {
      profile = await db.get('SELECT * FROM customer_profiles WHERE user_id = ?', [req.user.id]);
    }

    // Get unread notification count
    const notifCount = await db.get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);

    return res.json({
      success: true,
      user: req.user,
      profile,
      unreadNotifications: notifCount ? notifCount.count : 0
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

// Upload Profile Picture
router.post('/upload-avatar', requireAuth, async (req, res) => {
  try {
    const { imageData, avatarUrl } = req.body;

    let finalAvatarUrl = null;
    if (imageData) {
      finalAvatarUrl = saveBase64Avatar(req.user.id, imageData);
      if (!finalAvatarUrl) {
        return res.status(400).json({ success: false, message: 'Invalid image data. Supported formats: JPG, PNG, WEBP, GIF, SVG.' });
      }
    } else if (avatarUrl) {
      finalAvatarUrl = avatarUrl.trim();
    } else {
      return res.status(400).json({ success: false, message: 'Image data or avatar URL is required.' });
    }

    const now = new Date().toISOString();
    await db.run('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?', [finalAvatarUrl, now, req.user.id]);

    const updatedUser = await db.get(
      'SELECT id, email, full_name, role, phone, avatar_url, address, locality, city, state, pincode, latitude, longitude, is_verified FROM users WHERE id = ?',
      [req.user.id]
    );

    return res.json({
      success: true,
      message: 'Profile picture updated successfully.',
      avatarUrl: finalAvatarUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload profile picture.', error: error.message });
  }
});

// Update Profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      address,
      locality,
      city,
      state,
      pincode,
      latitude,
      longitude,
      avatarUrl,
      imageData,
      // Student specific
      bio,
      collegeName,
      educationLevel,
      skills,
      workingRadiusKm,
      isAvailable
    } = req.body;

    const now = new Date().toISOString();

    // Check if new image data or URL is provided
    let finalAvatarUrl = null;
    if (imageData) {
      finalAvatarUrl = saveBase64Avatar(req.user.id, imageData);
    } else if (avatarUrl !== undefined && typeof avatarUrl === 'string' && avatarUrl.trim().length > 0) {
      finalAvatarUrl = avatarUrl.trim();
    }

    // Name update (rewriteable user name)
    const newFullName = (fullName !== undefined && typeof fullName === 'string' && fullName.trim().length > 0)
      ? fullName.trim()
      : null;

    // State update / auto-detection from location
    let userState = (state !== undefined && typeof state === 'string' && state.trim().length > 0)
      ? state.trim()
      : null;
    if (!userState && (locality || pincode || city)) {
      userState = detectStateFromLocation({ locality, city, pincode });
    }

    await db.run(
      `UPDATE users SET 
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        locality = COALESCE(?, locality),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        pincode = COALESCE(?, pincode),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        avatar_url = COALESCE(?, avatar_url),
        updated_at = ?
       WHERE id = ?`,
      [
        newFullName,
        phone !== undefined ? phone : null,
        address !== undefined ? address : null,
        locality !== undefined ? locality : null,
        city !== undefined ? city : null,
        userState,
        pincode !== undefined ? pincode : null,
        latitude != null ? parseFloat(latitude) : null,
        longitude != null ? parseFloat(longitude) : null,
        finalAvatarUrl,
        now,
        req.user.id
      ]
    );

    if (req.user.role === 'student') {
      const skillsJson = skills ? (Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify(skills.split(',').map(s=>s.trim()))) : null;
      await db.run(
        `UPDATE student_profiles SET 
          bio = COALESCE(?, bio),
          college_name = COALESCE(?, college_name),
          education_level = COALESCE(?, education_level),
          skills = COALESCE(?, skills),
          working_radius_km = COALESCE(?, working_radius_km),
          is_available = COALESCE(?, is_available)
         WHERE user_id = ?`,
        [
          bio || null,
          collegeName || null,
          educationLevel || null,
          skillsJson || null,
          workingRadiusKm != null ? parseFloat(workingRadiusKm) : null,
          isAvailable != null ? (isAvailable ? 1 : 0) : null,
          req.user.id
        ]
      );
    } else if (req.user.role === 'neighbor') {
      await db.run(
        `UPDATE customer_profiles SET 
          bio = COALESCE(?, bio),
          default_address = COALESCE(?, default_address)
         WHERE user_id = ?`,
        [bio || null, address || null, req.user.id]
      );
    }

    const updatedUser = await db.get('SELECT id, email, full_name, role, phone, avatar_url, address, locality, city, state, pincode, latitude, longitude, is_verified FROM users WHERE id = ?', [req.user.id]);
    return res.json({ success: true, message: 'Profile updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// View Student Profile (public / for customers reviewing applicants)
router.get('/students/:id', async (req, res) => {
  try {
    const student = await db.get(
      `SELECT u.id, u.full_name, u.avatar_url, u.locality, u.city, u.is_verified,
              sp.bio, sp.college_name, sp.education_level, sp.skills, sp.working_radius_km, 
              sp.is_available, sp.is_guardian_approved, sp.total_tasks_completed, sp.average_rating, sp.ratings_count
       FROM users u
       JOIN student_profiles sp ON u.id = sp.user_id
       WHERE u.id = ? AND u.role = 'student'`,
      [req.params.id]
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    try { student.skills = JSON.parse(student.skills); } catch(e) {}

    // Get reviews for this student
    const reviews = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar, t.title as task_title
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       JOIN tasks t ON r.task_id = t.id
       WHERE r.reviewee_id = ? AND r.is_moderated = 0
       ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    return res.json({ success: true, student, reviews: reviews.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch student details.' });
  }
});

// Demo accounts endpoint for testing and fast one-click login
router.get('/demo-accounts', async (req, res) => {
  try {
    const accounts = await db.query(
      `SELECT id, email, full_name, role, locality, avatar_url FROM users 
       WHERE email IN ('admin@marketplace.local', 'priya.neighbor@gmail.com', 'rahul.student@iisc.edu.in', 'ananya.student@christ.edu.in', 'arun.neighbor@outlook.com')
       ORDER BY role ASC`
    );
    return res.json({ success: true, accounts: accounts.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch demo accounts.' });
  }
});

export default router;
