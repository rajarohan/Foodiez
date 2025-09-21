const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Customer = require('../models/Customer');
const Restaurant = require('../models/Restaurant');
const { validationResult } = require('express-validator');

// @desc    Create a new order from cart
// @route   POST /api/orders
// @access  Private (Customer only)
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { paymentMethod, deliveryAddress, specialInstructions } = req.body;

    // Get customer's active cart
    const cart = await Cart.findOne({ 
      customer: req.user._id, 
      isActive: true 
    })
      .populate('restaurant')
      .populate('items.menuItem');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
      });
    }

    // Check minimum order requirement
    if (cart.restaurant.minimumOrder && cart.totalAmount < cart.restaurant.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is $${cart.restaurant.minimumOrder}`,
      });
    }

    // Create order items from cart items
    const orderItems = cart.items.map(item => ({
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      price: item.price,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions,
    }));

    // Calculate estimated delivery time (current time + 30-60 minutes)
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 
      Math.floor(Math.random() * 31) + 30); // 30-60 minutes

    // Create order
    const order = new Order({
      customer: req.user._id,
      restaurant: cart.restaurant._id,
      items: orderItems,
      paymentMethod,
      deliveryAddress,
      orderTotal: {
        subtotal: cart.totalAmount,
        deliveryFee: cart.deliveryFee,
        taxes: cart.taxes,
        grandTotal: cart.grandTotal,
      },
      estimatedDeliveryTime,
      specialInstructions,
    });

    await order.save();

    // Clear the cart
    cart.isActive = false;
    await cart.save();

    // Populate order for response
    await order.populate('customer', 'name email phone');
    await order.populate('restaurant', 'name phone address');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get customer's orders
// @route   GET /api/orders
// @access  Private (Customer only)
const getCustomerOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = { customer: req.user._id };

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .populate('restaurant', 'name image cuisine address phone')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private (Customer & Admin)
const getOrder = async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // If customer, only show their orders
    if (req.userRole === 'customer') {
      query.customer = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name image cuisine address phone email')
      .populate('items.menuItem', 'name image category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Validate status transition
    const validStatuses = [
      'pending', 'confirmed', 'preparing', 'ready', 
      'out-for-delivery', 'delivered', 'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    order.status = status;

    // Set actual delivery time when delivered
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        actualDeliveryTime: order.actualDeliveryTime,
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

// @desc    Cancel order (Customer only)
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customer only)
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled', 'out-for-delivery'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        cancellationReason: order.cancellationReason,
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

// @desc    Add rating and review to order
// @route   PUT /api/orders/:id/review
// @access  Private (Customer only)
const addOrderReview = async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (!rating || !rating.overall) {
      return res.status(400).json({
        success: false,
        message: 'Overall rating is required',
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
      status: 'delivered',
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not delivered yet',
      });
    }

    if (order.rating && order.rating.overall) {
      return res.status(400).json({
        success: false,
        message: 'Order already reviewed',
      });
    }

    order.rating = rating;
    order.review = review;
    await order.save();

    res.json({
      success: true,
      message: 'Review added successfully',
      data: {
        orderNumber: order.orderNumber,
        rating: order.rating,
        review: order.review,
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

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin/all
// @access  Private (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by restaurant
    if (req.query.restaurant) {
      query.restaurant = req.query.restaurant;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name cuisine')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/admin/stats
// @access  Private (Admin only)
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get order counts by status
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get today's orders
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfDay },
    });

    // Get this month's orders
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Get revenue stats
    const revenueStats = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$orderTotal.grandTotal' },
          averageOrder: { $avg: '$orderTotal.grandTotal' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Get top restaurants by orders
    const topRestaurants = await Order.aggregate([
      {
        $group: {
          _id: '$restaurant',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$orderTotal.grandTotal' },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      { $unwind: '$restaurant' },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          todayOrders,
          monthOrders,
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          averageOrderValue: revenueStats[0]?.averageOrder || 0,
        },
        statusCounts,
        topRestaurants,
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
  createOrder,
  getCustomerOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  addOrderReview,
  getAllOrders,
  getOrderStats,
};