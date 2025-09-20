import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  StarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await api.restaurants.getById(id);
        setRestaurant(response.data.restaurant);
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        setError('Restaurant not found');
      }
    };

    const fetchMenuItems = async () => {
      try {
        const response = await api.menuItems.getByRestaurant(id);
        setMenuItems(response.data.menuItems || []);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setError('Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };

    const loadData = async () => {
      if (id) {
        await Promise.all([fetchRestaurant(), fetchMenuItems()]);
      }
    };
    loadData();
  }, [id]);

  const addToCart = async (menuItem) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/restaurant/${id}` } } });
      return;
    }

    try {
      await api.cart.add({
        menuItemId: menuItem._id,
        quantity: 1,
        restaurantId: id
      });
      
      // Update local cart state
      setCart(prev => ({
        ...prev,
        [menuItem._id]: (prev[menuItem._id] || 0) + 1
      }));
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add item to cart');
    }
  };

  const updateCartQuantity = async (menuItemId, newQuantity) => {
    if (newQuantity === 0) {
      try {
        await api.cart.removeItem(menuItemId);
        setCart(prev => {
          const newCart = { ...prev };
          delete newCart[menuItemId];
          return newCart;
        });
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
      return;
    }

    try {
      await api.cart.update(menuItemId, { quantity: newQuantity });
      setCart(prev => ({
        ...prev,
        [menuItemId]: newQuantity
      }));
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  const filteredMenuItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarSolidIcon key={i} className="h-5 w-5 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarSolidIcon key={i} className="h-5 w-5 text-yellow-400" />);
      } else {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-gray-300" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The restaurant you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/restaurants')}
            className="btn-primary"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="relative">
        <div className="aspect-w-16 aspect-h-6">
          <img
            src={restaurant.image || '/api/placeholder/1200/300'}
            alt={restaurant.name}
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center">
                {renderStars(restaurant.averageRating || 0)}
                <span className="ml-2">{restaurant.averageRating ? restaurant.averageRating.toFixed(1) : 'New'}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-1" />
                <span>{restaurant.address}</span>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 mr-1" />
                <span>{restaurant.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Restaurant Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-3">About {restaurant.name}</h2>
              <p className="text-gray-600 mb-4">{restaurant.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Cuisine</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {restaurant.cuisine.map((cuisine, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Average Price</h3>
                  <p className="text-gray-600">${restaurant.averagePrice || 15}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Status</h3>
                  <p className={restaurant.isOpen ? 'text-green-600' : 'text-red-600'}>
                    {restaurant.isOpen ? 'Open' : 'Closed'}
                  </p>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Menu Categories</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {filteredMenuItems.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img
                      src={item.image || '/api/placeholder/200/150'}
                      alt={item.name}
                      className="w-full sm:w-48 h-32 sm:h-36 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <span className="text-lg font-bold text-primary-600">${item.price}</span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                      
                      {/* Item details */}
                      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                        {item.preparationTime > 0 && (
                          <div className="flex items-center text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>{item.preparationTime} min</span>
                          </div>
                        )}
                        {item.isVegetarian && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Vegetarian</span>
                        )}
                        {item.isVegan && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Vegan</span>
                        )}
                        {item.isSpicy && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Spicy</span>
                        )}
                        {item.isFeatured && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Featured</span>
                        )}
                      </div>

                      {/* Add to cart section */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {item.calories > 0 && `${item.calories} cal`}
                        </div>
                        {restaurant.isOpen && item.isAvailable ? (
                          cart[item._id] > 0 ? (
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateCartQuantity(item._id, cart[item._id] - 1)}
                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className="font-medium">{cart[item._id]}</span>
                              <button
                                onClick={() => updateCartQuantity(item._id, cart[item._id] + 1)}
                                className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="btn-primary text-sm flex items-center space-x-2"
                            >
                              <ShoppingCartIcon className="h-4 w-4" />
                              <span>Add to Cart</span>
                            </button>
                          )
                        ) : (
                          <span className="text-sm text-gray-500">Unavailable</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredMenuItems.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
                <p className="text-gray-600">No items available in this category.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Restaurant Hours</h3>
              {restaurant.hours && Object.entries(restaurant.hours).map(([day, hours]) => (
                <div key={day} className="flex justify-between text-sm mb-2">
                  <span className="capitalize font-medium">{day}</span>
                  <span className="text-gray-600">
                    {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                  </span>
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">Cart Items</span>
                  <span className="text-sm text-gray-600">
                    {Object.values(cart).reduce((total, qty) => total + qty, 0)} items
                  </span>
                </div>
                {isAuthenticated && user?.role === 'customer' && (
                  <button
                    onClick={() => navigate('/cart')}
                    className="btn-primary w-full"
                  >
                    View Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;