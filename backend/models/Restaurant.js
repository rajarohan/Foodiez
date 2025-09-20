const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Restaurant description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Restaurant image is required']
  },
  cuisineType: {
    type: [String],
    required: [true, 'At least one cuisine type is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one cuisine type is required'
    }
  },
  address: {
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
      lat: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Please add a valid 10-digit phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  hours: {
    monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } }
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
  deliveryFee: {
    type: Number,
    required: [true, 'Delivery fee is required'],
    min: [0, 'Delivery fee cannot be negative']
  },
  minimumOrder: {
    type: Number,
    required: [true, 'Minimum order amount is required'],
    min: [0, 'Minimum order cannot be negative']
  },
  estimatedDeliveryTime: {
    type: String,
    required: [true, 'Estimated delivery time is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Restaurant must have an owner']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for menu items
restaurantSchema.virtual('menuItems', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'restaurant',
  justOne: false
});

// Virtual populate for reviews
restaurantSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'restaurant',
  justOne: false
});

// Index for location-based queries
restaurantSchema.index({ 'address.coordinates': '2dsphere' });

// Text index for search functionality
restaurantSchema.index({
  name: 'text',
  description: 'text',
  cuisineType: 'text',
  tags: 'text'
});

// Static method to find restaurants by cuisine
restaurantSchema.statics.findByCuisine = function(cuisine) {
  return this.find({ cuisineType: { $in: [cuisine] }, isActive: true });
};

// Static method to find restaurants near a location
restaurantSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  });
};

module.exports = mongoose.model('Restaurant', restaurantSchema);