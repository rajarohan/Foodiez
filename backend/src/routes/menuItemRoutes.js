const express = require('express');
const { body } = require('express-validator');
const {
  createMenuItem,
  getAllMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getMenuItemsByCategory,
  getMenuCategories,
} = require('../controllers/menuItemController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');

const router = express.Router();

// Validation middleware for menu item creation
const createMenuItemValidation = [
  body('name').notEmpty().withMessage('Menu item name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('restaurant').notEmpty().withMessage('Restaurant is required'),
];

// @route   GET /api/menu-items
// @desc    Get all menu items with filtering
// @access  Public
router.get('/', getAllMenuItems);

// @route   GET /api/menu-items/categories
// @desc    Get all menu categories
// @access  Public
router.get('/categories', getMenuCategories);

// @route   GET /api/menu-items/categories/:category
// @desc    Get menu items by category
// @access  Public
router.get('/categories/:category', getMenuItemsByCategory);

// @route   GET /api/menu-items/:id
// @desc    Get single menu item
// @access  Public
router.get('/:id', getMenuItem);

// @route   POST /api/menu-items
// @desc    Create a new menu item
// @access  Private (Admin only)
router.post(
  '/',
  protect,
  adminOnly,
  upload.single('image'),
  createMenuItemValidation,
  createMenuItem
);

// @route   PUT /api/menu-items/:id
// @desc    Update menu item
// @access  Private (Admin only)
router.put(
  '/:id',
  protect,
  adminOnly,
  upload.single('image'),
  updateMenuItem
);

// @route   DELETE /api/menu-items/:id
// @desc    Delete menu item
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, deleteMenuItem);

// @route   PATCH /api/menu-items/:id/toggle-availability
// @desc    Toggle menu item availability
// @access  Private (Admin only)
router.patch('/:id/toggle-availability', protect, adminOnly, toggleAvailability);

module.exports = router;