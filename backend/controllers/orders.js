const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Restaurant = require('../models/Restaurant');
const { asyncHandler } = require('../middleware/error');

// @desc    Get all orders for user
// @route   GET /api/orders
// @access  Private
exports.getOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = { user: req.user._id };

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  const orders = await Order.find(query)
    .populate('restaurant', 'name image cuisineType rating')
    .populate('items.menuItem', 'name image category')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: orders
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('restaurant', 'name image cuisineType rating phone address')
    .populate('items.menuItem', 'name image category')
    .populate('user', 'name phone email');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Make sure order belongs to user or user is admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this order'
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { deliveryAddress, contactInfo, paymentMethod, specialInstructions } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.menuItem')
    .populate('restaurant');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  // Validate restaurant is active
  if (!cart.restaurant.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant is currently unavailable'
    });
  }

  // Check minimum order requirement
  if (cart.subtotal < cart.restaurant.minimumOrder) {
    return res.status(400).json({
      success: false,
      message: `Minimum order amount is $${cart.restaurant.minimumOrder.toFixed(2)}`
    });
  }

  // Validate all menu items are still available
  for (const item of cart.items) {
    if (!item.menuItem.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `${item.menuItem.name} is no longer available`
      });
    }
  }

  // Create order items from cart
  const orderItems = cart.items.map(item => ({
    menuItem: item.menuItem._id,
    name: item.menuItem.name,
    price: item.price,
    quantity: item.quantity,
    customizations: item.customizations,
    specialInstructions: item.specialInstructions,
    totalPrice: item.totalPrice
  }));

  // Calculate estimated delivery time
  const estimatedDeliveryTime = new Date();
  const [time, unit] = cart.restaurant.estimatedDeliveryTime.split(' ');
  const minutes = unit.toLowerCase().includes('hour') ? parseInt(time) * 60 : parseInt(time);
  estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + minutes);

  // Create order
  const order = await Order.create({
    user: req.user._id,
    restaurant: cart.restaurant._id,
    items: orderItems,
    deliveryAddress,
    contactInfo: {
      phone: contactInfo.phone || req.user.phone,
      email: contactInfo.email || req.user.email
    },
    paymentMethod,
    pricing: {
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      tax: cart.tax,
      discount: cart.appliedCoupon ? 
        (cart.appliedCoupon.discountType === 'percentage' ? 
          cart.subtotal * (cart.appliedCoupon.discount / 100) : 
          cart.appliedCoupon.discount) : 0,
      total: cart.total
    },
    appliedCoupon: cart.appliedCoupon,
    estimatedDeliveryTime,
    specialInstructions
  });

  // Clear the cart after successful order creation
  await cart.clearCart();

  // Populate order for response
  const populatedOrder = await Order.findById(order._id)
    .populate('restaurant', 'name image cuisineType rating phone address')
    .populate('items.menuItem', 'name image category');

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: populatedOrder
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin only or Restaurant owner)
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;

  const validStatuses = [
    'pending', 'confirmed', 'preparing', 'ready', 
    'out-for-delivery', 'delivered', 'cancelled', 'refunded'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }

  const order = await Order.findById(req.params.id).populate('restaurant');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user is authorized to update order status
  if (req.user.role !== 'admin' && 
      order.restaurant.owner.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to update this order'
    });
  }

  await order.updateStatus(status, note);

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: order
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Make sure order belongs to user or user is admin
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to cancel this order'
    });
  }

  // Check if order can be cancelled
  if (!order.canBeCancelled()) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage'
    });
  }

  await order.cancelOrder(reason || 'Cancelled by customer');

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// @desc    Add rating and review to order
// @route   PUT /api/orders/:id/rating
// @access  Private
exports.addOrderRating = asyncHandler(async (req, res, next) => {
  const { food, delivery, overall, review } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Make sure order belongs to user
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to rate this order'
    });
  }

  // Check if order is delivered
  if (order.status !== 'delivered') {
    return res.status(400).json({
      success: false,
      message: 'Order must be delivered before rating'
    });
  }

  // Check if already rated
  if (order.rating && order.rating.overall) {
    return res.status(400).json({
      success: false,
      message: 'Order has already been rated'
    });
  }

  const ratings = { food, delivery, overall, review };
  await order.addRating(ratings);

  res.status(200).json({
    success: true,
    message: 'Rating added successfully',
    data: order
  });
});

// @desc    Get orders for restaurant (Admin/Restaurant owner)
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private (Admin or Restaurant owner)
exports.getRestaurantOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const restaurant = await Restaurant.findById(req.params.restaurantId);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  // Check if user is authorized
  if (req.user.role !== 'admin' && 
      restaurant.owner.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access these orders'
    });
  }

  let query = { restaurant: req.params.restaurantId };

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  const orders = await Order.find(query)
    .populate('user', 'name phone email')
    .populate('items.menuItem', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: orders
  });
});

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private (Admin only)
exports.getOrderStats = asyncHandler(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        confirmedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);

  const statusDistribution = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const monthlyStats = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$pricing.total' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      general: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
      },
      statusDistribution,
      monthlyStats
    }
  });
});