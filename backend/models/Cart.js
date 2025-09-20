const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Menu item is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  customizations: [{
    name: String,
    selectedOptions: [String],
    additionalPrice: {
      type: Number,
      default: 0
    }
  }],
  specialInstructions: {
    type: String,
    maxlength: [200, 'Special instructions cannot be more than 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required']
  }
}, {
  _id: false
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Cart must belong to a user'],
    unique: true
  },
  restaurant: {
    type: mongoose.Schema.ObjectId,
    ref: 'Restaurant',
    default: null
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  appliedCoupon: {
    code: String,
    discount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Update cart totals before saving
cartSchema.pre('save', async function(next) {
  if (this.items.length === 0) {
    this.subtotal = 0;
    this.deliveryFee = 0;
    this.tax = 0;
    this.total = 0;
    this.restaurant = null;
    return next();
  }

  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Get delivery fee from restaurant if restaurant is set
  if (this.restaurant) {
    const Restaurant = mongoose.model('Restaurant');
    const restaurant = await Restaurant.findById(this.restaurant);
    if (restaurant) {
      this.deliveryFee = restaurant.deliveryFee;
    }
  }

  // Calculate tax (8% for example)
  this.tax = this.subtotal * 0.08;

  // Apply coupon discount if any
  let discount = 0;
  if (this.appliedCoupon) {
    if (this.appliedCoupon.discountType === 'percentage') {
      discount = this.subtotal * (this.appliedCoupon.discount / 100);
    } else {
      discount = this.appliedCoupon.discount;
    }
  }

  // Calculate total
  this.total = this.subtotal + this.deliveryFee + this.tax - discount;
  this.total = Math.max(this.total, 0); // Ensure total is not negative

  this.lastUpdated = new Date();
  next();
});

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId })
                   .populate('items.menuItem')
                   .populate('restaurant');
  
  if (!cart) {
    cart = await this.create({ user: userId });
  }
  
  return cart;
};

// Method to add item to cart
cartSchema.methods.addItem = async function(menuItem, quantity, customizations = [], specialInstructions = '') {
  // If adding item from different restaurant, clear cart
  if (this.restaurant && !this.restaurant.equals(menuItem.restaurant)) {
    this.items = [];
    this.appliedCoupon = undefined;
  }

  // Set restaurant if not set
  if (!this.restaurant) {
    this.restaurant = menuItem.restaurant;
  }

  // Calculate customization price
  let customizationPrice = 0;
  customizations.forEach(customization => {
    customizationPrice += customization.additionalPrice || 0;
  });

  const itemPrice = menuItem.finalPrice + customizationPrice;
  const totalPrice = itemPrice * quantity;

  // Check if similar item already exists
  const existingItemIndex = this.items.findIndex(item => 
    item.menuItem.equals(menuItem._id) &&
    JSON.stringify(item.customizations) === JSON.stringify(customizations) &&
    item.specialInstructions === specialInstructions
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].totalPrice = 
      this.items[existingItemIndex].price * this.items[existingItemIndex].quantity;
  } else {
    // Add new item
    this.items.push({
      menuItem: menuItem._id,
      quantity,
      customizations,
      specialInstructions,
      price: itemPrice,
      totalPrice
    });
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemIndex) {
  if (itemIndex >= 0 && itemIndex < this.items.length) {
    this.items.splice(itemIndex, 1);
    
    // If no items left, reset restaurant
    if (this.items.length === 0) {
      this.restaurant = null;
      this.appliedCoupon = undefined;
    }
  }
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemIndex, quantity) {
  if (itemIndex >= 0 && itemIndex < this.items.length) {
    if (quantity <= 0) {
      return this.removeItem(itemIndex);
    }
    
    this.items[itemIndex].quantity = quantity;
    this.items[itemIndex].totalPrice = this.items[itemIndex].price * quantity;
  }
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.restaurant = null;
  this.appliedCoupon = undefined;
  return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discount, discountType) {
  this.appliedCoupon = {
    code: couponCode,
    discount,
    discountType
  };
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);