const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

// @desc    Get customer's cart
// @route   GET /api/cart
// @access  Private (Customer only)
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ 
      customer: req.user._id, 
      isActive: true 
    })
      .populate('restaurant', 'name image deliveryFee minimumOrder')
      .populate('items.menuItem', 'name image price category isAvailable');

    if (!cart) {
      return res.json({
        success: true,
        message: 'Cart is empty',
        data: {
          items: [],
          totalAmount: 0,
          deliveryFee: 0,
          taxes: 0,
          grandTotal: 0,
        },
      });
    }

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private (Customer only)
const addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity, specialInstructions } = req.body;

    // Validate input
    if (!menuItemId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Menu item ID and quantity are required',
      });
    }

    // Check if menu item exists and is available
    const menuItem = await MenuItem.findById(menuItemId).populate('restaurant');
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Menu item is not available',
      });
    }

    // Find existing cart or create new one
    let cart = await Cart.findOne({ 
      customer: req.user._id, 
      isActive: true 
    });

    if (cart) {
      // Check if cart is from the same restaurant
      if (cart.restaurant.toString() !== menuItem.restaurant._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You can only order from one restaurant at a time. Please clear your cart first.',
        });
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.menuItem.toString() === menuItemId
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        cart.items.push({
          menuItem: menuItemId,
          quantity,
          price: menuItem.price,
          specialInstructions,
        });
      }
    } else {
      // Create new cart
      cart = new Cart({
        customer: req.user._id,
        restaurant: menuItem.restaurant._id,
        items: [{
          menuItem: menuItemId,
          quantity,
          price: menuItem.price,
          specialInstructions,
        }],
        deliveryFee: menuItem.restaurant.deliveryFee || 0,
      });
    }

    // Set delivery fee from restaurant
    cart.deliveryFee = menuItem.restaurant.deliveryFee || 0;

    await cart.save();
    
    // Populate cart for response
    await cart.populate('restaurant', 'name image deliveryFee minimumOrder');
    await cart.populate('items.menuItem', 'name image price category');

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/item/:itemId
// @access  Private (Customer only)
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, specialInstructions } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    const cart = await Cart.findOne({ 
      customer: req.user._id, 
      isActive: true 
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    // Update item
    cart.items[itemIndex].quantity = quantity;
    if (specialInstructions !== undefined) {
      cart.items[itemIndex].specialInstructions = specialInstructions;
    }

    await cart.save();

    // Populate cart for response
    await cart.populate('restaurant', 'name image deliveryFee');
    await cart.populate('items.menuItem', 'name image price category');

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:itemId
// @access  Private (Customer only)
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ 
      customer: req.user._id, 
      isActive: true 
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    // Remove item from cart
    cart.items.splice(itemIndex, 1);

    // If cart is empty, mark as inactive
    if (cart.items.length === 0) {
      cart.isActive = false;
    }

    await cart.save();

    // Populate cart for response
    await cart.populate('restaurant', 'name image deliveryFee');
    await cart.populate('items.menuItem', 'name image price category');

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private (Customer only)
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ 
      customer: req.user._id, 
      isActive: true 
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    cart.isActive = false;
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        totalAmount: 0,
        deliveryFee: 0,
        taxes: 0,
        grandTotal: 0,
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

// @desc    Get cart summary for checkout
// @route   GET /api/cart/summary
// @access  Private (Customer only)
const getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ 
      customer: req.user._id, 
      isActive: true 
    })
      .populate('restaurant', 'name deliveryFee minimumOrder')
      .populate('items.menuItem', 'name price');

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
        data: {
          currentAmount: cart.totalAmount,
          minimumRequired: cart.restaurant.minimumOrder,
          shortfall: cart.restaurant.minimumOrder - cart.totalAmount,
        },
      });
    }

    res.json({
      success: true,
      data: {
        restaurant: cart.restaurant,
        itemCount: cart.items.length,
        totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: cart.totalAmount,
        deliveryFee: cart.deliveryFee,
        taxes: cart.taxes,
        grandTotal: cart.grandTotal,
        items: cart.items.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          specialInstructions: item.specialInstructions,
        })),
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
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
};