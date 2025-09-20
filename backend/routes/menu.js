const express = require('express');
const { body } = require('express-validator');
const {
  getMenuItems,
  getMenuItem,
  getMenuByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  menuItemPhotoUpload,
  getMenuCategories,
  getFeaturedMenuItems,
  getMenuItemStats
} = require('../controllers/menu');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');
// const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const menuItemValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Menu item name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn([
      'appetizers', 'main-course', 'desserts', 'beverages', 'salads',
      'soups', 'sides', 'breakfast', 'lunch', 'dinner', 'vegan',
      'vegetarian', 'gluten-free'
    ])
    .withMessage('Please select a valid category'),
  body('restaurant')
    .isMongoId()
    .withMessage('Please provide a valid restaurant ID'),
  body('preparationTime')
    .trim()
    .notEmpty()
    .withMessage('Preparation time is required'),
  body('spiceLevel')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Spice level must be between 0 and 5')
];

// Public routes
router.get('/', getMenuItems);
router.get('/featured', getFeaturedMenuItems);
router.get('/stats', protect, authorize('admin'), getMenuItemStats);
router.get('/restaurant/:restaurantId', getMenuByRestaurant);
router.get('/restaurant/:restaurantId/categories', getMenuCategories);
router.get('/:id', getMenuItem);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), menuItemValidation, handleValidationErrors, createMenuItem);
router.put('/:id', protect, authorize('admin'), updateMenuItem);
router.delete('/:id', protect, authorize('admin'), deleteMenuItem);
// router.put('/:id/photo', protect, authorize('admin'), uploadSingle('image'), menuItemPhotoUpload);

module.exports = router;