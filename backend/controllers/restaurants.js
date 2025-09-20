const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const { asyncHandler } = require('../middleware/error');
const { deleteImage, getPublicIdFromUrl } = require('../middleware/upload');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = { isActive: true };

  // Search by name, cuisine, or tags
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by cuisine type
  if (req.query.cuisine) {
    query.cuisineType = { $in: [req.query.cuisine] };
  }

  // Filter by minimum rating
  if (req.query.minRating) {
    query['rating.average'] = { $gte: parseFloat(req.query.minRating) };
  }

  // Sort options
  let sortOptions = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'rating':
        sortOptions = { 'rating.average': -1 };
        break;
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'deliveryFee':
        sortOptions = { deliveryFee: 1 };
        break;
      case 'minimumOrder':
        sortOptions = { minimumOrder: 1 };
        break;
    }
  }

  const restaurants = await Restaurant.find(query)
    .populate('owner', 'name email')
    .sort(sortOptions)
    .limit(limit)
    .skip(skip);

  const total = await Restaurant.countDocuments(query);

  res.status(200).json({
    success: true,
    count: restaurants.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: restaurants
  });
});

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id)
    .populate('owner', 'name email')
    .populate({
      path: 'menuItems',
      match: { isAvailable: true },
      select: 'name description price category image tags isVegetarian isVegan discount rating'
    });

  if (!restaurant || !restaurant.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  res.status(200).json({
    success: true,
    data: restaurant
  });
});

// @desc    Create new restaurant
// @route   POST /api/restaurants
// @access  Private (Admin only)
exports.createRestaurant = asyncHandler(async (req, res, next) => {
  // Add user as owner
  req.body.owner = req.user._id;

  const restaurant = await Restaurant.create(req.body);

  res.status(201).json({
    success: true,
    data: restaurant
  });
});

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (Admin only)
exports.updateRestaurant = asyncHandler(async (req, res, next) => {
  let restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  // Make sure user is restaurant owner or admin
  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to update this restaurant'
    });
  }

  // If image is being updated, delete old image
  if (req.body.image && restaurant.image && req.body.image !== restaurant.image) {
    try {
      const publicId = getPublicIdFromUrl(restaurant.image);
      await deleteImage(publicId);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }

  restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: restaurant
  });
});

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (Admin only)
exports.deleteRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  // Make sure user is restaurant owner or admin
  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to delete this restaurant'
    });
  }

  // Delete restaurant image
  if (restaurant.image) {
    try {
      const publicId = getPublicIdFromUrl(restaurant.image);
      await deleteImage(publicId);
    } catch (error) {
      console.error('Error deleting restaurant image:', error);
    }
  }

  // Delete all menu items for this restaurant
  const menuItems = await MenuItem.find({ restaurant: restaurant._id });
  for (const menuItem of menuItems) {
    if (menuItem.image) {
      try {
        const publicId = getPublicIdFromUrl(menuItem.image);
        await deleteImage(publicId);
      } catch (error) {
        console.error('Error deleting menu item image:', error);
      }
    }
  }
  
  await MenuItem.deleteMany({ restaurant: restaurant._id });

  // Soft delete - mark as inactive
  restaurant.isActive = false;
  await restaurant.save();

  res.status(200).json({
    success: true,
    message: 'Restaurant deleted successfully'
  });
});

// @desc    Get restaurants near location
// @route   GET /api/restaurants/nearby/:zipcode/:distance
// @route   GET /api/restaurants/nearby/:lat/:lng/:distance
// @access  Public
exports.getRestaurantsInRadius = asyncHandler(async (req, res, next) => {
  const { lat, lng, distance } = req.params;
  
  // Convert distance to radians (distance in miles)
  const radius = distance / 3963; // Earth's radius in miles

  const restaurants = await Restaurant.find({
    'address.coordinates': {
      $geoWithin: {
        $centerSphere: [[parseFloat(lng), parseFloat(lat)], radius]
      }
    },
    isActive: true
  }).populate('owner', 'name email');

  res.status(200).json({
    success: true,
    count: restaurants.length,
    data: restaurants
  });
});

// @desc    Upload photo for restaurant
// @route   PUT /api/restaurants/:id/photo
// @access  Private (Admin only)
exports.restaurantPhotoUpload = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  // Make sure user is restaurant owner or admin
  if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to update this restaurant'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  // Delete old image if exists
  if (restaurant.image) {
    try {
      const publicId = getPublicIdFromUrl(restaurant.image);
      await deleteImage(publicId);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }

  // Update restaurant with new image URL
  restaurant.image = req.file.path;
  await restaurant.save();

  res.status(200).json({
    success: true,
    data: {
      image: req.file.path
    }
  });
});

// @desc    Get restaurant statistics (Admin)
// @route   GET /api/restaurants/stats
// @access  Private (Admin only)
exports.getRestaurantStats = asyncHandler(async (req, res, next) => {
  const stats = await Restaurant.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalRestaurants: { $sum: 1 },
        averageRating: { $avg: '$rating.average' },
        averageDeliveryFee: { $avg: '$deliveryFee' },
        averageMinimumOrder: { $avg: '$minimumOrder' }
      }
    }
  ]);

  const cuisineStats = await Restaurant.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $unwind: '$cuisineType'
    },
    {
      $group: {
        _id: '$cuisineType',
        count: { $sum: 1 }
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
        totalRestaurants: 0,
        averageRating: 0,
        averageDeliveryFee: 0,
        averageMinimumOrder: 0
      },
      cuisineDistribution: cuisineStats
    }
  });
});