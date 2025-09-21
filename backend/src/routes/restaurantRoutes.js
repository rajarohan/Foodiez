const express = require('express');
const { body } = require('express-validator');
const {
  createRestaurant,
  getAllRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantMenu,
  getRestaurantStats,
} = require('../controllers/restaurantController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

// Validation middleware for restaurant creation
const createRestaurantValidation = [
  body('name').notEmpty().withMessage('Restaurant name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('Zip code is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('cuisine').notEmpty().withMessage('Cuisine type is required'),
];

// @route   GET /api/restaurants
// @desc    Get all restaurants with filtering and search
// @access  Public
router.get('/', getAllRestaurants);

// @route   GET /api/restaurants/:id
// @desc    Get single restaurant
// @access  Public
router.get('/:id', getRestaurant);

// @route   POST /api/restaurants
// @desc    Create a new restaurant
// @access  Private (Admin only)
router.post(
  '/',
  protect,
  adminOnly,
  upload.single('image'),
  createRestaurantValidation,
  createRestaurant
);

// @route   PUT /api/restaurants/:id
// @desc    Update restaurant
// @access  Private (Admin only)
router.put(
  '/:id',
  protect,
  adminOnly,
  upload.single('image'),
  updateRestaurant
);

// @route   DELETE /api/restaurants/:id
// @desc    Delete restaurant
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, deleteRestaurant);

// @route   GET /api/restaurants/:id/menu
// @desc    Get restaurant menu items
// @access  Public
router.get('/:id/menu', getRestaurantMenu);

// @route   GET /api/restaurants/:id/stats
// @desc    Get restaurant statistics
// @access  Private (Admin only)
router.get('/:id/stats', protect, adminOnly, getRestaurantStats);

module.exports = router;