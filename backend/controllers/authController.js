import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { sendTokens, verifyToken } from '../utils/tokenUtils.js';
import { sendWelcomeEmail } from '../utils/emailService.js';

// ── @desc   Register a new user
// ── @route  POST /api/auth/register
// ── @access Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error('Email already registered');
    }

    // Create user (password is hashed by pre-save hook in User.js)
    const user = await User.create({ name, email, password, role, phone });

    // Log the registration
    await AuditLog.create({
      user: user._id,
      action: 'REGISTER',
      description: `New ${role || 'tenant'} account created: ${email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });

    // Send welcome email (non-blocking — don't await so it doesn't slow response)
    sendWelcomeEmail(user).catch(console.error);

    // Send access token + set refresh cookie
    sendTokens(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// ── @desc   Login user
// ── @route  POST /api/auth/login
// ── @access Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly include password (select:false by default)
    const user = await User.findOne({ email }).select('+password');

    // Check if email exists
    if (!user) {
      await AuditLog.create({
        user: null,
        action: 'LOGIN_FAILED',
        description: `Login attempt with unregistered email: ${email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
      });
      res.status(401);
      throw new Error('No account found with this email. Please register first.');
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await AuditLog.create({
        user: user._id,
        action: 'LOGIN_FAILED',
        description: `Wrong password attempt for: ${email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
      });
      res.status(401);
      throw new Error('Wrong password. Please try again.');
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account has been deactivated. Contact admin.');
    }

    // Log successful login
    await AuditLog.create({
      user: user._id,
      action: 'LOGIN',
      description: `${user.role} ${user.name} logged in`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });

    sendTokens(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ── @desc   Refresh access token using refresh token cookie
// ── @route  POST /api/auth/refresh
// ── @access Public
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      res.status(401);
      throw new Error('No refresh token found');
    }

    // Verify the refresh token
    const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    // Issue new tokens
    sendTokens(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ── @desc   Logout — clear refresh token cookie
// ── @route  POST /api/auth/logout
// ── @access Private
export const logout = async (req, res, next) => {
  try {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0), // Immediately expire the cookie
    });

    await AuditLog.create({
      user: req.user?._id,
      action: 'LOGOUT',
      description: `User ${req.user?.name} logged out`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// ── @desc   Get current logged-in user
// ── @route  GET /api/auth/me
// ── @access Private
export const getMe = async (req, res, next) => {
  try {
    // req.user is already attached by the protect middleware
    const user = await User.findById(req.user._id).populate('allocatedRoom');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ── Notifications ──────────────────────────────────────────

// @route GET /api/auth/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .limit(20);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/auth/notifications/:id/read
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/auth/notifications/read-all
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
