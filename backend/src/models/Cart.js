const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  specialInstructions: {
    type: String,
    trim: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxes: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate totals before saving
cartSchema.pre('save', function (next) {
  // Calculate total amount from items
  this.totalAmount = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // Calculate taxes (assuming 8% tax)
  this.taxes = this.totalAmount * 0.08;

  // Calculate grand total
  this.grandTotal = this.totalAmount + this.deliveryFee + this.taxes;

  next();
});

// Create indexes
cartSchema.index({ customer: 1 });
cartSchema.index({ restaurant: 1 });
cartSchema.index({ isActive: 1 });

module.exports = mongoose.model('Cart', cartSchema);