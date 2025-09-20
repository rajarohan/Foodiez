const express = require('express');
const { body } = require('express-validator');
const {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantsInRadius,
  restaurantPhotoUpload,
  getRestaurantStats
} = require('../controllers/restaurants');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');
// const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const restaurantValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Restaurant name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('cuisineType')
    .isArray({ min: 1 })
    .withMessage('At least one cuisine type is required'),
  body('phone')
    .matches(/^\d{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.zipCode')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required'),
  body('address.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('address.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('deliveryFee')
    .isFloat({ min: 0 })
    .withMessage('Delivery fee must be a positive number'),
  body('minimumOrder')
    .isFloat({ min: 0 })
    .withMessage('Minimum order must be a positive number'),
  body('estimatedDeliveryTime')
    .trim()
    .notEmpty()
    .withMessage('Estimated delivery time is required')
];

// Public routes
router.get('/', getRestaurants);
router.get('/stats', protect, authorize('admin'), getRestaurantStats);
router.get('/nearby/:lat/:lng/:distance', getRestaurantsInRadius);
router.get('/:id', getRestaurant);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), restaurantValidation, handleValidationErrors, createRestaurant);
router.put('/:id', protect, authorize('admin'), updateRestaurant);
router.delete('/:id', protect, authorize('admin'), deleteRestaurant);
// router.put('/:id/photo', protect, authorize('admin'), uploadSingle('image'), restaurantPhotoUpload);

module.exports = router;