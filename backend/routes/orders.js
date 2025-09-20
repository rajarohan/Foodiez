const express = require('express');
const { body } = require('express-validator');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  addOrderRating,
  getRestaurantOrders,
  getOrderStats
} = require('../controllers/orders');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('deliveryAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('deliveryAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('deliveryAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('deliveryAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'wallet', 'upi'])
    .withMessage('Please select a valid payment method'),
  body('contactInfo.phone')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('specialInstructions')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters')
];

const updateOrderStatusValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Please provide a valid status'),
  body('note')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Note cannot exceed 200 characters')
];

const cancelOrderValidation = [
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters')
];

const addRatingValidation = [
  body('food')
    .isInt({ min: 1, max: 5 })
    .withMessage('Food rating must be between 1 and 5'),
  body('delivery')
    .isInt({ min: 1, max: 5 })
    .withMessage('Delivery rating must be between 1 and 5'),
  body('overall')
    .isInt({ min: 1, max: 5 })
    .withMessage('Overall rating must be between 1 and 5'),
  body('review')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Review cannot exceed 500 characters')
];

// All routes require authentication
router.use(protect);

// Order routes
router.get('/', getOrders);
router.get('/stats', authorize('admin'), getOrderStats);
router.get('/restaurant/:restaurantId', getRestaurantOrders);
router.get('/:id', getOrder);
router.post('/', createOrderValidation, handleValidationErrors, createOrder);

// Order management routes
router.put('/:id/status', authorize('admin'), updateOrderStatusValidation, handleValidationErrors, updateOrderStatus);
router.put('/:id/cancel', cancelOrderValidation, handleValidationErrors, cancelOrder);
router.put('/:id/rating', addRatingValidation, handleValidationErrors, addOrderRating);

module.exports = router;