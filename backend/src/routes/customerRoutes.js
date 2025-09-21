const express = require('express');
const { body } = require('express-validator');
const {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  addToFavorites,
  removeFromFavorites,
} = require('../controllers/customerController');
const { protect, customerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// @route   POST /api/customer/register
// @desc    Register a new customer
// @access  Public
router.post('/register', registerValidation, registerCustomer);

// @route   POST /api/customer/login
// @desc    Login customer
// @access  Public
router.post('/login', loginValidation, loginCustomer);

// @route   GET /api/customer/profile
// @desc    Get customer profile
// @access  Private (Customer only)
router.get('/profile', protect, customerOnly, getCustomerProfile);

// @route   PUT /api/customer/profile
// @desc    Update customer profile
// @access  Private (Customer only)
router.put('/profile', protect, customerOnly, updateCustomerProfile);

// @route   POST /api/customer/favorites/:restaurantId
// @desc    Add restaurant to favorites
// @access  Private (Customer only)
router.post('/favorites/:restaurantId', protect, customerOnly, addToFavorites);

// @route   DELETE /api/customer/favorites/:restaurantId
// @desc    Remove restaurant from favorites
// @access  Private (Customer only)
router.delete('/favorites/:restaurantId', protect, customerOnly, removeFromFavorites);

module.exports = router;