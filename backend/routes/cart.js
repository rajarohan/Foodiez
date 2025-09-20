const express = require('express');
const { body } = require('express-validator');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  validateCart
} = require('../controllers/cart');
const { protect } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');

const router = express.Router();

// Validation rules
const addToCartValidation = [
  body('menuItemId')
    .isMongoId()
    .withMessage('Please provide a valid menu item ID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('specialInstructions')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Special instructions cannot exceed 200 characters')
];

const updateCartItemValidation = [
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer')
];

const applyCouponValidation = [
  body('couponCode')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters')
];

// All routes require authentication
router.use(protect);

// Cart routes
router.get('/', getCart);
router.post('/items', addToCartValidation, handleValidationErrors, addToCart);
router.put('/items/:itemIndex', updateCartItemValidation, handleValidationErrors, updateCartItem);
router.delete('/items/:itemIndex', removeFromCart);
router.delete('/', clearCart);

// Coupon routes
router.post('/coupon', applyCouponValidation, handleValidationErrors, applyCoupon);
router.delete('/coupon', removeCoupon);

// Validation route
router.post('/validate', validateCart);

module.exports = router;