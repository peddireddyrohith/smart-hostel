import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import tenantRoutes from './routes/tenant.js';

// ── Load environment variables ─────────────────────────────
dotenv.config();

// ── Initialize Express app ─────────────────────────────────
const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies (for httpOnly JWT refresh token)
}));
app.use(express.json());                        // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser());                        // Parse cookies from requests
app.use(morgan('dev'));                          // Log HTTP requests in terminal

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/tenant', tenantRoutes);

// ── Serve Frontend ─────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // For any other route, send back the React index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
  });
} else {
  // ── Health Check (Development) ───────────────────────────
  app.get('/', (req, res) => {
    res.json({ message: '🏠 Smart Hostel API is running...' });
  });
}

// ── Global Error Handler (must be last middleware) ─────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
