import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    } else {
      setFilteredRestaurants(restaurants);
    }
  }, [searchQuery, restaurants]);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/api/restaurants');
      setRestaurants(response.data.restaurants || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : 'New';
  };

  const getStatusColor = (isOpen) => {
    return isOpen ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Restaurants</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search restaurants, cuisine, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <button 
              onClick={fetchRestaurants}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No restaurants found' : 'No restaurants available'}
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search criteria' : 'Check back later for new restaurants'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <Link
                  key={restaurant._id}
                  to={`/restaurant/${restaurant._id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={restaurant.image || '/api/placeholder/400/200'}
                      alt={restaurant.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center space-x-1 ml-2">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          {formatRating(restaurant.averageRating)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span className={getStatusColor(restaurant.isOpen)}>
                          {restaurant.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <span className="text-gray-600">
                        ${restaurant.averagePrice || '15'} avg
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {restaurant.cuisine.slice(0, 3).map((cuisine, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {cuisine}
                        </span>
                      ))}
                      {restaurant.cuisine.length > 3 && (
                        <span className="inline-block text-gray-500 text-xs px-2 py-1">
                          +{restaurant.cuisine.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Restaurants;