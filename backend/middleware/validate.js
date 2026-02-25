import { body, validationResult } from 'express-validator';

// ── Middleware: Run validation and return errors if any ────
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Validation Rules ───────────────────────────────────────

// Register
export const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('role')
    .optional()
    .isIn(['admin', 'tenant']).withMessage('Role must be admin or tenant'),
];

// Login
export const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// Create Room (Admin)
export const roomRules = [
  body('roomNumber')
    .trim()
    .notEmpty().withMessage('Room number is required'),

  body('type')
    .notEmpty().withMessage('Room type is required')
    .isIn(['single', 'double', 'triple']).withMessage('Type must be single, double, or triple'),

  body('rent')
    .notEmpty().withMessage('Rent is required')
    .isNumeric().withMessage('Rent must be a number')
    .isFloat({ min: 0 }).withMessage('Rent must be a positive number'),

  body('floor')
    .optional()
    .isNumeric().withMessage('Floor must be a number'),
];

// Submit Complaint (Tenant)
export const complaintRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Complaint title is required'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['maintenance', 'noise', 'cleanliness', 'security', 'other'])
    .withMessage('Invalid complaint category'),
];
