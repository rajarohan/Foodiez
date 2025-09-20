const express = require('express');
const { body } = require('express-validator');
const { 
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  refreshToken
} = require('../controllers/auth');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('phone')
    .matches(/^\d{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Role must be either customer or admin')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateDetailsValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Please provide a valid 10-digit phone number')
];

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Public routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);
router.post('/logout', logout);
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], handleValidationErrors, forgotPassword);
router.put('/reset-password/:resettoken', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], handleValidationErrors, resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-details', protect, updateDetailsValidation, handleValidationErrors, updateDetails);
router.put('/update-password', protect, updatePasswordValidation, handleValidationErrors, updatePassword);

// Admin routes
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/User');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit)
      },
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;