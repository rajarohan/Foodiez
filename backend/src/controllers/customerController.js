const Customer = require('../models/Customer');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');

// @desc    Register a new customer
// @route   POST /api/customer/register
// @access  Public
const registerCustomer = async (req, res) => {
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

    const { name, email, password, phone, address } = req.body;

    // Check if customer already exists
    const customerExists = await Customer.findOne({ email });
    if (customerExists) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists',
      });
    }

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      password,
      phone,
      address,
    });

    if (customer) {
      res.status(201).json({
        success: true,
        message: 'Customer registered successfully',
        data: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: customer.role,
          token: generateToken(customer._id, customer.role),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid customer data',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Login customer
// @route   POST /api/customer/login
// @access  Public
const loginCustomer = async (req, res) => {
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

    const { email, password } = req.body;

    // Check for customer
    const customer = await Customer.findOne({ email }).select('+password');

    if (customer && (await customer.matchPassword(password))) {
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: customer.role,
          token: generateToken(customer._id, customer.role),
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get customer profile
// @route   GET /api/customer/profile
// @access  Private (Customer only)
const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate(
      'preferences.favoriteRestaurants',
      'name image cuisine rating'
    );

    if (customer) {
      res.json({
        success: true,
        data: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: customer.role,
          avatar: customer.avatar,
          address: customer.address,
          dateOfBirth: customer.dateOfBirth,
          preferences: customer.preferences,
          isActive: customer.isActive,
          createdAt: customer.createdAt,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customer/profile
// @access  Private (Customer only)
const updateCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);

    if (customer) {
      customer.name = req.body.name || customer.name;
      customer.phone = req.body.phone || customer.phone;
      customer.dateOfBirth = req.body.dateOfBirth || customer.dateOfBirth;
      
      if (req.body.address) {
        customer.address = { ...customer.address, ...req.body.address };
      }
      
      if (req.body.preferences) {
        customer.preferences = { ...customer.preferences, ...req.body.preferences };
      }
      
      if (req.body.password) {
        customer.password = req.body.password;
      }

      const updatedCustomer = await customer.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          _id: updatedCustomer._id,
          name: updatedCustomer.name,
          email: updatedCustomer.email,
          phone: updatedCustomer.phone,
          role: updatedCustomer.role,
          avatar: updatedCustomer.avatar,
          address: updatedCustomer.address,
          preferences: updatedCustomer.preferences,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Add restaurant to favorites
// @route   POST /api/customer/favorites/:restaurantId
// @access  Private (Customer only)
const addToFavorites = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    const restaurantId = req.params.restaurantId;

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Check if restaurant is already in favorites
    if (customer.preferences.favoriteRestaurants.includes(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant already in favorites',
      });
    }

    customer.preferences.favoriteRestaurants.push(restaurantId);
    await customer.save();

    res.json({
      success: true,
      message: 'Restaurant added to favorites',
      data: customer.preferences.favoriteRestaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Remove restaurant from favorites
// @route   DELETE /api/customer/favorites/:restaurantId
// @access  Private (Customer only)
const removeFromFavorites = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    const restaurantId = req.params.restaurantId;

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    customer.preferences.favoriteRestaurants = customer.preferences.favoriteRestaurants.filter(
      (id) => id.toString() !== restaurantId
    );

    await customer.save();

    res.json({
      success: true,
      message: 'Restaurant removed from favorites',
      data: customer.preferences.favoriteRestaurants,
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
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  addToFavorites,
  removeFromFavorites,
};