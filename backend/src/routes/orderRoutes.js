const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getCustomerOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  addOrderReview,
  getAllOrders,
  getOrderStats,
} = require('../controllers/orderController');
const { protect, adminOnly, customerOnly, allowBoth } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation middleware for order creation
const createOrderValidation = [
  body('paymentMethod')
    .isIn(['cash', 'credit-card', 'debit-card', 'digital-wallet', 'upi'])
    .withMessage('Invalid payment method'),
  body('deliveryAddress.street').notEmpty().withMessage('Street address is required'),
  body('deliveryAddress.city').notEmpty().withMessage('City is required'),
  body('deliveryAddress.state').notEmpty().withMessage('State is required'),
  body('deliveryAddress.zipCode').notEmpty().withMessage('Zip code is required'),
  body('deliveryAddress.phone').notEmpty().withMessage('Phone number is required'),
];

// Validation for order review
const reviewValidation = [
  body('rating.overall')
    .isInt({ min: 1, max: 5 })
    .withMessage('Overall rating must be between 1 and 5'),
];

// Customer routes
// @route   GET /api/orders
// @desc    Get customer's orders
// @access  Private (Customer only)
router.get('/', protect, customerOnly, getCustomerOrders);

// @route   POST /api/orders
// @desc    Create a new order from cart
// @access  Private (Customer only)
router.post('/', protect, customerOnly, createOrderValidation, createOrder);

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private (Customer & Admin)
router.get('/:id', protect, allowBoth, getOrder);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private (Customer only)
router.put('/:id/cancel', protect, customerOnly, cancelOrder);

// @route   PUT /api/orders/:id/review
// @desc    Add rating and review to order
// @access  Private (Customer only)
router.put('/:id/review', protect, customerOnly, reviewValidation, addOrderReview);

// Admin routes
// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private (Admin only)
router.get('/admin/all', protect, adminOnly, getAllOrders);

// @route   GET /api/orders/admin/stats
// @desc    Get order statistics
// @access  Private (Admin only)
router.get('/admin/stats', protect, adminOnly, getOrderStats);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Admin only)
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;