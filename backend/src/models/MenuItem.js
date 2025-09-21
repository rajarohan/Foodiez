const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Menu item description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Appetizer',
        'Main Course',
        'Dessert',
        'Beverage',
        'Salad',
        'Soup',
        'Pizza',
        'Burger',
        'Pasta',
        'Sandwich',
        'Seafood',
        'Vegetarian',
        'Vegan',
        'Other',
      ],
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    ingredients: [String],
    allergens: [String],
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15,
    },
    spiceLevel: {
      type: String,
      enum: ['Mild', 'Medium', 'Hot', 'Extra Hot', 'None'],
      default: 'None',
    },
    dietary: {
      vegetarian: { type: Boolean, default: false },
      vegan: { type: Boolean, default: false },
      glutenFree: { type: Boolean, default: false },
      dairyFree: { type: Boolean, default: false },
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for search and filtering
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ restaurant: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ 'dietary.vegetarian': 1 });
menuItemSchema.index({ 'dietary.vegan': 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);