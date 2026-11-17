import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import db from './database/db.js';
import { seedDatabase } from './database/seed.js';
import { setupSocketIO } from './sockets/socketHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/tasks.routes.js';
import applicationRoutes from './routes/applications.routes.js';
import messageRoutes from './routes/messages.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import reportRoutes from './routes/reports.routes.js';
import adminRoutes from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

app.set('io', io);
setupSocketIO(io);

// Middleware & uploads directory setup
const uploadsDir = path.resolve(__dirname, '../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static route to serve uploaded assets
app.use('/api/uploads', express.static(uploadsDir));
app.use('/uploads', express.static(uploadsDir));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Neighborhood Student Help Marketplace API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: db.isPostgres ? 'PostgreSQL' : 'SQLite'
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Neighborhood Student Help Marketplace API is active. Access /api/health or frontend client.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred.',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Database & Seed
async function startServer() {
  try {
    await db.initSchema();
    await seedDatabase();

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Marketplace Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket / Socket.io server ready`);
      console.log(`💾 Database: ${db.isPostgres ? 'PostgreSQL' : 'SQLite'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal: Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
