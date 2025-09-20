const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Menu item is required']
  },
  name: {
    type: String,
    required: [true, 'Item name is required']
  },
  price: {
    type: Number,
    required: [true, 'Item price is required']
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
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required']
  }
}, {
  _id: false
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: [true, 'Order number is required']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Order must belong to a user']
  },
  restaurant: {
    type: mongoose.Schema.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Order must belong to a restaurant']
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out-for-delivery',
      'delivered',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'wallet', 'upi'],
    required: [true, 'Payment method is required']
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    paymentDate: Date
  },
  deliveryAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    instructions: String
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Contact phone is required']
    },
    email: {
      type: String,
      required: [true, 'Contact email is required']
    }
  },
  pricing: {
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required']
    },
    deliveryFee: {
      type: Number,
      required: [true, 'Delivery fee is required']
    },
    tax: {
      type: Number,
      required: [true, 'Tax is required']
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: [true, 'Total is required']
    }
  },
  appliedCoupon: {
    code: String,
    discount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  estimatedDeliveryTime: {
    type: Date,
    required: [true, 'Estimated delivery time is required']
  },
  actualDeliveryTime: Date,
  orderType: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  specialInstructions: {
    type: String,
    maxlength: [500, 'Special instructions cannot be more than 500 characters']
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  rating: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters']
    },
    reviewDate: Date
  },
  cancellationReason: String,
  refundAmount: {
    type: Number,
    default: 0
  },
  deliveryAgent: {
    name: String,
    phone: String,
    vehicleDetails: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `FZ${timestamp}${random}`;
  }
  next();
});

// Update timeline when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: `Order status updated to ${this.status}`
    });
  }
  next();
});

// Index for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId, limit = 10, skip = 0) {
  return this.find({ user: userId })
             .populate('restaurant', 'name image')
             .populate('items.menuItem', 'name image')
             .sort({ createdAt: -1 })
             .limit(limit)
             .skip(skip);
};

// Static method to find orders by restaurant
orderSchema.statics.findByRestaurant = function(restaurantId, status = null, limit = 10, skip = 0) {
  const query = { restaurant: restaurantId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
             .populate('user', 'name phone email')
             .populate('items.menuItem', 'name')
             .sort({ createdAt: -1 })
             .limit(limit)
             .skip(skip);
};

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, note = '') {
  this.status = newStatus;
  
  if (note) {
    this.timeline.push({
      status: newStatus,
      timestamp: new Date(),
      note
    });
  }
  
  // Set actual delivery time when delivered
  if (newStatus === 'delivered' && !this.actualDeliveryTime) {
    this.actualDeliveryTime = new Date();
  }
  
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancelOrder = function(reason) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  return this.save();
};

// Method to process refund
orderSchema.methods.processRefund = function(amount) {
  this.refundAmount = amount;
  this.paymentStatus = 'refunded';
  this.status = 'refunded';
  return this.save();
};

// Method to add rating
orderSchema.methods.addRating = function(ratings) {
  this.rating = {
    ...ratings,
    reviewDate: new Date()
  };
  return this.save();
};

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  const nonCancellableStatuses = ['out-for-delivery', 'delivered', 'cancelled', 'refunded'];
  return !nonCancellableStatuses.includes(this.status);
};

// Method to check if order can be modified
orderSchema.methods.canBeModified = function() {
  const nonModifiableStatuses = ['preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled', 'refunded'];
  return !nonModifiableStatuses.includes(this.status);
};

module.exports = mongoose.model('Order', orderSchema);