const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { validationResult } = require('express-validator');

// @desc    Create a new menu item
// @route   POST /api/menu-items
// @access  Private (Admin only)
const createMenuItem = async (req, res) => {
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

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(req.body.restaurant);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const menuItemData = {
      ...req.body,
      createdBy: req.user._id,
    };

    // Handle image upload if present
    if (req.file) {
      menuItemData.image = req.file.path;
    }

    const menuItem = await MenuItem.create(menuItemData);
    await menuItem.populate('restaurant', 'name cuisine');

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all menu items
// @route   GET /api/menu-items
// @access  Public
const getAllMenuItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by restaurant
    if (req.query.restaurant) {
      query.restaurant = req.query.restaurant;
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by availability
    if (req.query.available !== undefined) {
      query.isAvailable = req.query.available === 'true';
    } else {
      query.isAvailable = true; // Default to available items only
    }

    // Filter by dietary preferences
    if (req.query.vegetarian === 'true') {
      query['dietary.vegetarian'] = true;
    }
    if (req.query.vegan === 'true') {
      query['dietary.vegan'] = true;
    }
    if (req.query.glutenFree === 'true') {
      query['dietary.glutenFree'] = true;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Sort
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'name cuisine rating address.city')
      .sort({ [sortBy]: sortOrder })
      .skip(startIndex)
      .limit(limit);

    const total = await MenuItem.countDocuments(query);

    res.json({
      success: true,
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

// @desc    Get single menu item
// @route   GET /api/menu-items/:id
// @access  Public
const getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('restaurant', 'name cuisine rating address phone')
      .populate('createdBy', 'name');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu-items/:id
// @access  Private (Admin only)
const updateMenuItem = async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    // Handle image upload if present
    if (req.file) {
      req.body.image = req.file.path;
    }

    menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('restaurant', 'name cuisine');

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu-items/:id
// @access  Private (Admin only)
const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Toggle menu item availability
// @route   PATCH /api/menu-items/:id/toggle-availability
// @access  Private (Admin only)
const toggleAvailability = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: {
        _id: menuItem._id,
        name: menuItem.name,
        isAvailable: menuItem.isAvailable,
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

// @desc    Get menu items by category
// @route   GET /api/menu-items/categories/:category
// @access  Public
const getMenuItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let query = { 
      category: category,
      isAvailable: true 
    };

    // Filter by restaurant if provided
    if (req.query.restaurant) {
      query.restaurant = req.query.restaurant;
    }

    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'name cuisine rating')
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);

    const total = await MenuItem.countDocuments(query);

    res.json({
      success: true,
      category,
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

// @desc    Get menu categories
// @route   GET /api/menu-items/categories
// @access  Public
const getMenuCategories = async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    
    res.json({
      success: true,
      data: categories.sort(),
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
  createMenuItem,
  getAllMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getMenuItemsByCategory,
  getMenuCategories,
};