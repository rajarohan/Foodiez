const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { asyncHandler } = require('../middleware/error');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.getOrCreateCart(req.user._id)
    .populate({
      path: 'items.menuItem',
      populate: {
        path: 'restaurant',
        select: 'name image deliveryFee minimumOrder'
      }
    })
    .populate('restaurant', 'name image deliveryFee minimumOrder estimatedDeliveryTime');

  res.status(200).json({
    success: true,
    data: cart
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { menuItemId, quantity, customizations, specialInstructions } = req.body;

  // Validate input
  if (!menuItemId || !quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Menu item ID and valid quantity are required'
    });
  }

  // Get menu item
  const menuItem = await MenuItem.findById(menuItemId).populate('restaurant');
  
  if (!menuItem || !menuItem.isAvailable) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found or unavailable'
    });
  }

  // Check if restaurant is active
  if (!menuItem.restaurant.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant is currently unavailable'
    });
  }

  // Get or create cart
  const cart = await Cart.getOrCreateCart(req.user._id);

  try {
    await cart.addItem(menuItem, quantity, customizations || [], specialInstructions || '');
    
    // Populate cart for response
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.menuItem',
        populate: {
          path: 'restaurant',
          select: 'name image deliveryFee minimumOrder'
        }
      })
      .populate('restaurant', 'name image deliveryFee minimumOrder estimatedDeliveryTime');

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: updatedCart
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add item to cart'
    });
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:itemIndex
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const itemIndex = parseInt(req.params.itemIndex);

  if (quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be a positive number'
    });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  if (itemIndex < 0 || itemIndex >= cart.items.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid item index'
    });
  }

  await cart.updateItemQuantity(itemIndex, quantity);

  // Populate cart for response
  const updatedCart = await Cart.findById(cart._id)
    .populate({
      path: 'items.menuItem',
      populate: {
        path: 'restaurant',
        select: 'name image deliveryFee minimumOrder'
      }
    })
    .populate('restaurant', 'name image deliveryFee minimumOrder estimatedDeliveryTime');

  res.status(200).json({
    success: true,
    message: 'Cart item updated successfully',
    data: updatedCart
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemIndex
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const itemIndex = parseInt(req.params.itemIndex);

  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  if (itemIndex < 0 || itemIndex >= cart.items.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid item index'
    });
  }

  await cart.removeItem(itemIndex);

  // Populate cart for response
  const updatedCart = await Cart.findById(cart._id)
    .populate({
      path: 'items.menuItem',
      populate: {
        path: 'restaurant',
        select: 'name image deliveryFee minimumOrder'
      }
    })
    .populate('restaurant', 'name image deliveryFee minimumOrder estimatedDeliveryTime');

  res.status(200).json({
    success: true,
    message: 'Item removed from cart successfully',
    data: updatedCart
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  await cart.clearCart();

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: cart
  });
});

// @desc    Apply coupon to cart
// @route   POST /api/cart/coupon
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    return res.status(400).json({
      success: false,
      message: 'Coupon code is required'
    });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  // Simple coupon validation (in real app, you'd have a Coupon model)
  const validCoupons = {
    'SAVE10': { discount: 10, discountType: 'percentage' },
    'FLAT50': { discount: 50, discountType: 'fixed' },
    'WELCOME20': { discount: 20, discountType: 'percentage' },
    'NEWUSER': { discount: 15, discountType: 'percentage' }
  };

  const coupon = validCoupons[couponCode.toUpperCase()];
  
  if (!coupon) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coupon code'
    });
  }

  // Check minimum order requirement (if applicable)
  if (coupon.minimumOrder && cart.subtotal < coupon.minimumOrder) {
    return res.status(400).json({
      success: false,
      message: `Minimum order of $${coupon.minimumOrder} required for this coupon`
    });
  }

  await cart.applyCoupon(couponCode.toUpperCase(), coupon.discount, coupon.discountType);

  // Populate cart for response
  const updatedCart = await Cart.findById(cart._id)
    .populate({
      path: 'items.menuItem',
      populate: {
        path: 'restaurant',
        select: 'name image deliveryFee minimumOrder'
      }
    })
    .populate('restaurant', 'name image deliveryFee minimumOrder estimatedDeliveryTime');

  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully',
    data: updatedCart
  });
});

// @desc    Remove coupon from cart
// @route   DELETE /api/cart/coupon
// @access  Private
exports.removeCoupon = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.appliedCoupon = undefined;
  await cart.save();

  // Populate cart for response
  const updatedCart = await Cart.findById(cart._id)
    .populate({
      path: 'items.menuItem',
      populate: {
        path: 'restaurant',
        select: 'name image deliveryFee minimumOrder'
      }
    })
    .populate('restaurant', 'name image deliveryFee minimumOrder estimatedDeliveryTime');

  res.status(200).json({
    success: true,
    message: 'Coupon removed successfully',
    data: updatedCart
  });
});

// @desc    Validate cart before checkout
// @route   POST /api/cart/validate
// @access  Private
exports.validateCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.menuItem')
    .populate('restaurant');
  
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty',
      errors: ['Cart is empty']
    });
  }

  const errors = [];

  // Check if restaurant is still active
  if (!cart.restaurant || !cart.restaurant.isActive) {
    errors.push('Restaurant is currently unavailable');
  }

  // Check minimum order requirement
  if (cart.restaurant && cart.subtotal < cart.restaurant.minimumOrder) {
    errors.push(`Minimum order amount is $${cart.restaurant.minimumOrder.toFixed(2)}`);
  }

  // Check if all items are still available
  for (const item of cart.items) {
    if (!item.menuItem.isAvailable) {
      errors.push(`${item.menuItem.name} is no longer available`);
    }
    
    // Check if price has changed
    if (Math.abs(item.price - item.menuItem.finalPrice) > 0.01) {
      errors.push(`Price of ${item.menuItem.name} has been updated`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart validation failed',
      errors
    });
  }

  res.status(200).json({
    success: true,
    message: 'Cart is valid for checkout',
    data: cart
  });
});