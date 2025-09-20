const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user']
  },
  restaurant: {
    type: mongoose.Schema.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Review must be for a restaurant']
  },
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    required: [true, 'Review must be associated with an order']
  },
  rating: {
    food: {
      type: Number,
      required: [true, 'Food rating is required'],
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      required: [true, 'Service rating is required'],
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      required: [true, 'Delivery rating is required'],
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: 1,
      max: 5
    }
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [500, 'Review comment cannot be more than 500 characters']
  },
  images: [String],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  isReported: {
    type: Boolean,
    default: false
  },
  response: {
    comment: String,
    respondedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure one review per order per user
reviewSchema.index({ user: 1, order: 1 }, { unique: true });
reviewSchema.index({ restaurant: 1, createdAt: -1 });

// Update restaurant rating after review is saved
reviewSchema.post('save', async function() {
  const stats = await this.constructor.aggregate([
    {
      $match: { restaurant: this.restaurant }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating.overall' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Restaurant').findByIdAndUpdate(this.restaurant, {
      'rating.average': Math.round(stats[0].averageRating * 10) / 10,
      'rating.totalReviews': stats[0].totalReviews
    });
  }
});

// Update restaurant rating after review is removed
reviewSchema.post('remove', async function() {
  const stats = await this.constructor.aggregate([
    {
      $match: { restaurant: this.restaurant }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating.overall' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Restaurant').findByIdAndUpdate(this.restaurant, {
      'rating.average': Math.round(stats[0].averageRating * 10) / 10,
      'rating.totalReviews': stats[0].totalReviews
    });
  } else {
    await mongoose.model('Restaurant').findByIdAndUpdate(this.restaurant, {
      'rating.average': 0,
      'rating.totalReviews': 0
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);