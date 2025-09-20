const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
    maxlength: [100, 'Menu item name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Menu item description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'appetizers',
      'main-course',
      'desserts',
      'beverages',
      'salads',
      'soups',
      'sides',
      'breakfast',
      'lunch',
      'dinner',
      'vegan',
      'vegetarian',
      'gluten-free'
    ]
  },
  image: {
    type: String,
    required: [true, 'Menu item image is required']
  },
  restaurant: {
    type: mongoose.Schema.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Menu item must belong to a restaurant']
  },
  ingredients: [String],
  allergens: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sodium: Number
  },
  tags: [String],
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  preparationTime: {
    type: String,
    required: [true, 'Preparation time is required']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  customizations: [{
    name: String,
    options: [{
      name: String,
      price: {
        type: Number,
        default: 0
      }
    }],
    isRequired: {
      type: Boolean,
      default: false
    },
    maxSelections: {
      type: Number,
      default: 1
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discounted price
menuItemSchema.virtual('discountedPrice').get(function() {
  if (this.discount.isActive && this.discount.percentage > 0) {
    const now = new Date();
    const isWithinDiscountPeriod = 
      (!this.discount.startDate || now >= this.discount.startDate) &&
      (!this.discount.endDate || now <= this.discount.endDate);
    
    if (isWithinDiscountPeriod) {
      return this.price * (1 - this.discount.percentage / 100);
    }
  }
  return this.price;
});

// Virtual for final price (considering discount)
menuItemSchema.virtual('finalPrice').get(function() {
  return this.discountedPrice;
});

// Text index for search functionality
menuItemSchema.index({
  name: 'text',
  description: 'text',
  ingredients: 'text',
  tags: 'text'
});

// Compound index for restaurant and category
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });

// Static method to find items by restaurant
menuItemSchema.statics.findByRestaurant = function(restaurantId) {
  return this.find({ restaurant: restaurantId, isAvailable: true })
             .populate('restaurant', 'name');
};

// Static method to find items by category
menuItemSchema.statics.findByCategory = function(category, restaurantId = null) {
  const query = { category, isAvailable: true };
  if (restaurantId) {
    query.restaurant = restaurantId;
  }
  return this.find(query).populate('restaurant', 'name');
};

// Method to check if item is currently discounted
menuItemSchema.methods.isCurrentlyDiscounted = function() {
  if (!this.discount.isActive || this.discount.percentage <= 0) {
    return false;
  }
  
  const now = new Date();
  const isWithinDiscountPeriod = 
    (!this.discount.startDate || now >= this.discount.startDate) &&
    (!this.discount.endDate || now <= this.discount.endDate);
  
  return isWithinDiscountPeriod;
};

module.exports = mongoose.model('MenuItem', menuItemSchema);