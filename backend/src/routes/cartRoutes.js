const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
} = require('../controllers/cartController');
const { protect, customerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/cart
// @desc    Get customer's cart
// @access  Private (Customer only)
router.get('/', protect, customerOnly, getCart);

// @route   GET /api/cart/summary
// @desc    Get cart summary for checkout
// @access  Private (Customer only)
router.get('/summary', protect, customerOnly, getCartSummary);

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private (Customer only)
router.post('/add', protect, customerOnly, addToCart);

// @route   PUT /api/cart/item/:itemId
// @desc    Update cart item quantity
// @access  Private (Customer only)
router.put('/item/:itemId', protect, customerOnly, updateCartItem);

// @route   DELETE /api/cart/item/:itemId
// @desc    Remove item from cart
// @access  Private (Customer only)
router.delete('/item/:itemId', protect, customerOnly, removeFromCart);

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private (Customer only)
router.delete('/clear', protect, customerOnly, clearCart);

module.exports = router;