const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { asyncHandler } = require('../middleware/error');
const { deleteImage, getPublicIdFromUrl } = require('../middleware/upload');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
exports.getMenuItems = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Build query
  let query = { isAvailable: true };

  // Filter by restaurant
  if (req.query.restaurant) {
    query.restaurant = req.query.restaurant;
  }

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Search by name, description, or ingredients
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by dietary preferences
  if (req.query.isVegetarian === 'true') {
    query.isVegetarian = true;
  }
  if (req.query.isVegan === 'true') {
    query.isVegan = true;
  }
  if (req.query.isGlutenFree === 'true') {
    query.isGlutenFree = true;
  }

  // Filter by price range
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) {
      query.price.$gte = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      query.price.$lte = parseFloat(req.query.maxPrice);
    }
  }

  // Sort options
  let sortOptions = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { 'rating.average': -1 };
        break;
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'popularity':
        sortOptions = { 'rating.totalReviews': -1 };
        break;
    }
  }

  const menuItems = await MenuItem.find(query)
    .populate('restaurant', 'name image cuisineType rating deliveryFee')
    .sort(sortOptions)
    .limit(limit)
    .skip(skip);

  const total = await MenuItem.countDocuments(query);

  res.status(200).json({
    success: true,
    count: menuItems.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: menuItems
  });
});

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
exports.getMenuItem = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id)
    .populate('restaurant', 'name image cuisineType rating deliveryFee estimatedDeliveryTime');

  if (!menuItem || !menuItem.isAvailable) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  res.status(200).json({
    success: true,
    data: menuItem
  });
});

// @desc    Get menu items by restaurant
// @route   GET /api/menu/restaurant/:restaurantId
// @access  Public
exports.getMenuByRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  
  if (!restaurant || !restaurant.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  // Group menu items by category
  const menuItems = await MenuItem.find({ 
    restaurant: req.params.restaurantId, 
    isAvailable: true 
  }).sort({ category: 1, name: 1 });

  // Group by category
  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        description: restaurant.description,
        image: restaurant.image,
        cuisineType: restaurant.cuisineType,
        rating: restaurant.rating,
        deliveryFee: restaurant.deliveryFee,
        minimumOrder: restaurant.minimumOrder,
        estimatedDeliveryTime: restaurant.estimatedDeliveryTime
      },
      menu: groupedMenu,
      totalItems: menuItems.length
    }
  });
});

// @desc    Create new menu item
// @route   POST /api/menu
// @access  Private (Admin only)
exports.createMenuItem = asyncHandler(async (req, res, next) => {
  // Check if restaurant exists and user is owner or admin
  const restaurant = await Restaurant.findById(req.body.restaurant);
  
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to add menu items to this restaurant'
    });
  }

  const menuItem = await MenuItem.create(req.body);

  res.status(201).json({
    success: true,
    data: menuItem
  });
});

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (Admin only)
exports.updateMenuItem = asyncHandler(async (req, res, next) => {
  let menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  // Make sure user is restaurant owner or admin
  if (menuItem.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to update this menu item'
    });
  }

  // If image is being updated, delete old image
  if (req.body.image && menuItem.image && req.body.image !== menuItem.image) {
    try {
      const publicId = getPublicIdFromUrl(menuItem.image);
      await deleteImage(publicId);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }

  menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: menuItem
  });
});

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Admin only)
exports.deleteMenuItem = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  // Make sure user is restaurant owner or admin
  if (menuItem.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to delete this menu item'
    });
  }

  // Delete menu item image
  if (menuItem.image) {
    try {
      const publicId = getPublicIdFromUrl(menuItem.image);
      await deleteImage(publicId);
    } catch (error) {
      console.error('Error deleting menu item image:', error);
    }
  }

  // Soft delete - mark as unavailable
  menuItem.isAvailable = false;
  await menuItem.save();

  res.status(200).json({
    success: true,
    message: 'Menu item deleted successfully'
  });
});

// @desc    Upload photo for menu item
// @route   PUT /api/menu/:id/photo
// @access  Private (Admin only)
exports.menuItemPhotoUpload = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found'
    });
  }

  // Make sure user is restaurant owner or admin
  if (menuItem.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to update this menu item'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  // Delete old image if exists
  if (menuItem.image) {
    try {
      const publicId = getPublicIdFromUrl(menuItem.image);
      await deleteImage(publicId);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }

  // Update menu item with new image URL
  menuItem.image = req.file.path;
  await menuItem.save();

  res.status(200).json({
    success: true,
    data: {
      image: req.file.path
    }
  });
});

// @desc    Get menu categories for a restaurant
// @route   GET /api/menu/restaurant/:restaurantId/categories
// @access  Public
exports.getMenuCategories = asyncHandler(async (req, res, next) => {
  const categories = await MenuItem.distinct('category', { 
    restaurant: req.params.restaurantId, 
    isAvailable: true 
  });

  res.status(200).json({
    success: true,
    data: categories
  });
});

// @desc    Get featured menu items
// @route   GET /api/menu/featured
// @access  Public
exports.getFeaturedMenuItems = asyncHandler(async (req, res, next) => {
  const featuredItems = await MenuItem.find({
    isAvailable: true,
    'rating.average': { $gte: 4.0 },
    'rating.totalReviews': { $gte: 10 }
  })
  .populate('restaurant', 'name image rating')
  .sort({ 'rating.average': -1, 'rating.totalReviews': -1 })
  .limit(12);

  res.status(200).json({
    success: true,
    count: featuredItems.length,
    data: featuredItems
  });
});

// @desc    Get menu item statistics (Admin)
// @route   GET /api/menu/stats
// @access  Private (Admin only)
exports.getMenuItemStats = asyncHandler(async (req, res, next) => {
  const stats = await MenuItem.aggregate([
    {
      $match: { isAvailable: true }
    },
    {
      $group: {
        _id: null,
        totalMenuItems: { $sum: 1 },
        averagePrice: { $avg: '$price' },
        averageRating: { $avg: '$rating.average' },
        vegetarianCount: {
          $sum: { $cond: ['$isVegetarian', 1, 0] }
        },
        veganCount: {
          $sum: { $cond: ['$isVegan', 1, 0] }
        },
        glutenFreeCount: {
          $sum: { $cond: ['$isGlutenFree', 1, 0] }
        }
      }
    }
  ]);

  const categoryStats = await MenuItem.aggregate([
    {
      $match: { isAvailable: true }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        averagePrice: { $avg: '$price' },
        averageRating: { $avg: '$rating.average' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      general: stats[0] || {
        totalMenuItems: 0,
        averagePrice: 0,
        averageRating: 0,
        vegetarianCount: 0,
        veganCount: 0,
        glutenFreeCount: 0
      },
      categoryDistribution: categoryStats
    }
  });
});