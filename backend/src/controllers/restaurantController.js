const Restaurant = require('../models/Restaurant');
const { validationResult } = require('express-validator');

// @desc    Create a new restaurant
// @route   POST /api/restaurants
// @access  Private (Admin only)
const createRestaurant = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const restaurantData = {
      ...req.body,
      createdBy: req.user._id,
    };

    // Handle image upload if present
    if (req.file) {
      restaurantData.image = req.file.path;
    }

    const restaurant = await Restaurant.create(restaurantData);

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
const getAllRestaurants = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = Restaurant.find();

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $text: { $search: req.query.search },
      });
    }

    // Filter by cuisine
    if (req.query.cuisine) {
      query = query.find({ cuisine: req.query.cuisine });
    }

    // Filter by city
    if (req.query.city) {
      query = query.find({ 'address.city': new RegExp(req.query.city, 'i') });
    }

    // Filter by rating
    if (req.query.minRating) {
      query = query.find({ rating: { $gte: req.query.minRating } });
    }

    // Filter by price range
    if (req.query.priceRange) {
      query = query.find({ priceRange: req.query.priceRange });
    }

    // Sort
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    query = query.sort({ [sortBy]: sortOrder });

    // Execute query with pagination
    const restaurants = await query
      .skip(startIndex)
      .limit(limit)
      .populate('createdBy', 'name email');

    // Get total count for pagination
    const total = await Restaurant.countDocuments(query.getQuery());

    res.json({
      success: true,
      count: restaurants.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (Admin only)
const updateRestaurant = async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Handle image upload if present
    if (req.file) {
      req.body.image = req.file.path;
    }

    restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (Admin only)
const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    await Restaurant.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get restaurant menu items
// @route   GET /api/restaurants/:id/menu
// @access  Public
const getRestaurantMenu = async (req, res) => {
  try {
    const MenuItem = require('../models/MenuItem');
    
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let query = { restaurant: req.params.id, isAvailable: true };

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by dietary preferences
    if (req.query.vegetarian === 'true') {
      query['dietary.vegetarian'] = true;
    }
    if (req.query.vegan === 'true') {
      query['dietary.vegan'] = true;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = req.query.minPrice;
      if (req.query.maxPrice) query.price.$lte = req.query.maxPrice;
    }

    const menuItems = await MenuItem.find(query)
      .skip(startIndex)
      .limit(limit)
      .sort({ category: 1, name: 1 });

    const total = await MenuItem.countDocuments(query);

    res.json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
      },
      count: menuItems.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get restaurant statistics
// @route   GET /api/restaurants/:id/stats
// @access  Private (Admin only)
const getRestaurantStats = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const MenuItem = require('../models/MenuItem');
    const Order = require('../models/Order');

    // Get counts
    const menuItemCount = await MenuItem.countDocuments({ restaurant: req.params.id });
    const orderCount = await Order.countDocuments({ restaurant: req.params.id });

    // Get revenue
    const revenueData = await Order.aggregate([
      { $match: { restaurant: restaurant._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$orderTotal.grandTotal' } } },
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ restaurant: req.params.id })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          rating: restaurant.rating,
          reviewCount: restaurant.reviewCount,
        },
        stats: {
          menuItems: menuItemCount,
          orders: orderCount,
          totalRevenue: revenueData[0]?.total || 0,
        },
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantMenu,
  getRestaurantStats,
};