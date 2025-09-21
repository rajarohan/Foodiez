const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');

// @desc    Register a new admin
// @route   POST /api/admin/register
// @access  Public (but should be restricted in production)
const registerAdmin = async (req, res) => {
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

    const { name, email, password, phone } = req.body;

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists',
      });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password,
      phone,
    });

    if (admin) {
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          token: generateToken(admin._id, admin.role),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid admin data',
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

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
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

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          token: generateToken(admin._id, admin.role),
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

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);

    if (admin) {
      res.json({
        success: true,
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          avatar: admin.avatar,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
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

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);

    if (admin) {
      admin.name = req.body.name || admin.name;
      admin.phone = req.body.phone || admin.phone;
      
      if (req.body.password) {
        admin.password = req.body.password;
      }

      const updatedAdmin = await admin.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          _id: updatedAdmin._id,
          name: updatedAdmin.name,
          email: updatedAdmin.email,
          phone: updatedAdmin.phone,
          role: updatedAdmin.role,
          avatar: updatedAdmin.avatar,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
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

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    const Restaurant = require('../models/Restaurant');
    const MenuItem = require('../models/MenuItem');
    const Order = require('../models/Order');
    const Customer = require('../models/Customer');

    // Get counts
    const restaurantCount = await Restaurant.countDocuments();
    const menuItemCount = await MenuItem.countDocuments();
    const orderCount = await Order.countDocuments();
    const customerCount = await Customer.countDocuments();

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get total revenue (sum of all completed orders)
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$orderTotal.grandTotal' } } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          restaurants: restaurantCount,
          menuItems: menuItemCount,
          orders: orderCount,
          customers: customerCount,
          totalRevenue: totalRevenue[0]?.total || 0,
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
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  getDashboardStats,
};