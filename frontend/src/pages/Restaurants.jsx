import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Filter, Star, Clock, MapPin, UtensilsCrossed, ArrowUpDown } from 'lucide-react';
import { getRestaurants, setFilters, clearFilters } from '../redux/restaurantSlice';
import Loading from '../components/Loading';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';

const Restaurants = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { restaurants, isLoading, error, filters } = useSelector((state) => state.restaurants);
  
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const cuisineTypes = ['Italian', 'Chinese', 'Indian', 'Mexican', 'American', 'Thai', 'Japanese', 'Mediterranean'];
  const priceRanges = [
    { label: '$', value: '1' },
    { label: '$$', value: '2' },
    { label: '$$$', value: '3' },
    { label: '$$$$', value: '4' }
  ];

  useEffect(() => {
    // Load initial filters from URL params
    const initialFilters = {
      search: searchParams.get('search') || '',
      cuisine: searchParams.get('cuisine') || '',
      city: searchParams.get('city') || '',
      minRating: searchParams.get('minRating') || '',
      priceRange: searchParams.get('priceRange') || '',
    };
    
    dispatch(setFilters(initialFilters));
    
    // Fetch restaurants with filters
    fetchRestaurants({ ...initialFilters, sort: `-${sortBy}` });
  }, [dispatch, searchParams, sortBy]);

  const fetchRestaurants = (params = {}) => {
    dispatch(getRestaurants({
      ...filters,
      ...params,
      isActive: true, // Only show active restaurants to customers
      page: 1,
      limit: 20
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newFilters = { ...filters, search: localSearch };
    dispatch(setFilters(newFilters));
    updateURLParams(newFilters);
    fetchRestaurants(newFilters);
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    dispatch(setFilters(newFilters));
    updateURLParams(newFilters);
    fetchRestaurants(newFilters);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setLocalSearch('');
    setSortBy('rating');
    setSearchParams({});
    fetchRestaurants({});
  };

  const updateURLParams = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} fill="currentColor" className="text-warning" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} fill="currentColor" className="text-warning" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-muted" />);
    }
    
    return stars;
  };

  return (
    <div className="restaurants-page">
      {/* Header Section */}
      <div className="bg-primary text-white py-4">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="h2 fw-bold mb-2">Restaurants Near You</h1>
              <p className="mb-0">Discover amazing food from local restaurants</p>
            </div>
            <div className="col-lg-4">
              <form onSubmit={handleSearch} className="d-flex">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search restaurants or cuisines..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                  <button className="btn btn-warning" type="submit">
                    <Search size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {/* Filters and Sorting */}
        <div className="row mb-4">
          <div className="col-lg-12">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              {/* Filter Toggle */}
              <button
                className="btn btn-outline-primary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} className="me-1" />
                Filters
                {(filters.cuisine || filters.city || filters.minRating || filters.priceRange) && (
                  <span className="badge bg-danger ms-1">•</span>
                )}
              </button>

              {/* Sort Options */}
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">Sort by:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="rating">Rating</option>
                  <option value="deliveryTime">Delivery Time</option>
                  <option value="deliveryFee">Delivery Fee</option>
                  <option value="name">Name A-Z</option>
                </select>
                <ArrowUpDown size={18} className="text-muted" />
              </div>

              {/* Results Count */}
              <span className="text-muted">
                {restaurants.length} restaurants found
              </span>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="card mt-3">
                <div className="card-body">
                  <div className="row g-3">
                    {/* Cuisine Filter */}
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Cuisine Type</label>
                      <select
                        className="form-select"
                        value={filters.cuisine}
                        onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                      >
                        <option value="">All Cuisines</option>
                        {cuisineTypes.map(cuisine => (
                          <option key={cuisine} value={cuisine}>{cuisine}</option>
                        ))}
                      </select>
                    </div>

                    {/* City Filter */}
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">City</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter city"
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                      />
                    </div>

                    {/* Rating Filter */}
                    <div className="col-md-2">
                      <label className="form-label fw-semibold">Min Rating</label>
                      <select
                        className="form-select"
                        value={filters.minRating}
                        onChange={(e) => handleFilterChange('minRating', e.target.value)}
                      >
                        <option value="">Any Rating</option>
                        <option value="4">4+ Stars</option>
                        <option value="3.5">3.5+ Stars</option>
                        <option value="3">3+ Stars</option>
                      </select>
                    </div>

                    {/* Price Range Filter */}
                    <div className="col-md-2">
                      <label className="form-label fw-semibold">Price Range</label>
                      <select
                        className="form-select"
                        value={filters.priceRange}
                        onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                      >
                        <option value="">Any Price</option>
                        {priceRanges.map(range => (
                          <option key={range.value} value={range.value}>{range.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Clear Filters */}
                    <div className="col-md-2 d-flex align-items-end">
                      <button
                        className="btn btn-outline-secondary w-100"
                        onClick={handleClearFilters}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Loading size="lg" text="Loading restaurants..." fullScreen={false} />
        ) : error ? (
          <ErrorMessage 
            error={error} 
            onRetry={() => fetchRestaurants()} 
          />
        ) : restaurants.length === 0 ? (
          <EmptyState
            title="No restaurants found"
            message="Try adjusting your search criteria or filters to find more restaurants."
            action={
              <button className="btn btn-primary" onClick={handleClearFilters}>
                Clear Filters
              </button>
            }
          />
        ) : (
          <div className="row">
            {restaurants.map((restaurant) => (
              <div key={restaurant._id} className="col-lg-4 col-md-6 mb-4">
                <div className="card h-100 shadow-sm hover-shadow">
                  <div className="position-relative">
                    <img
                      src={restaurant.image || '/api/placeholder/300/200'}
                      className="card-img-top"
                      alt={restaurant.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="position-absolute top-0 end-0 m-2">
                      <span className="badge bg-success d-flex align-items-center">
                        <Star size={12} className="me-1" />
                        {restaurant.rating || '4.5'}
                      </span>
                    </div>
                    {restaurant.deliveryFee === 0 && (
                      <div className="position-absolute top-0 start-0 m-2">
                        <span className="badge bg-warning text-dark">FREE DELIVERY</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-body">
                    <h5 className="card-title fw-bold mb-2">{restaurant.name}</h5>
                    
                    <div className="mb-2">
                      <div className="d-flex align-items-center mb-1">
                        {getRatingStars(restaurant.rating || 4.5)}
                        <span className="ms-2 text-muted small">
                          ({restaurant.reviewCount || '100+'} reviews)
                        </span>
                      </div>
                    </div>

                    <p className="card-text text-muted mb-2">
                      <UtensilsCrossed size={16} className="me-1" />
                      {restaurant.cuisine} • {restaurant.address?.city || 'City'}
                    </p>

                    <div className="d-flex justify-content-between align-items-center text-muted small">
                      <div className="d-flex align-items-center">
                        <Clock size={14} className="me-1" />
                        {restaurant.deliveryTime || '30-45'} min
                      </div>
                      <div className="d-flex align-items-center">
                        <MapPin size={14} className="me-1" />
                        {restaurant.distance || '2.5'} km
                      </div>
                      <div>
                        Delivery: ${restaurant.deliveryFee || '2.99'}
                      </div>
                    </div>
                  </div>

                  <div className="card-footer bg-transparent">
                    <div className="d-flex gap-2">
                      <Link 
                        to={`/restaurants/${restaurant._id}`} 
                        className="btn btn-primary flex-grow-1"
                      >
                        View Menu
                      </Link>
                      <button className="btn btn-outline-primary">
                        <Star size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button (if needed) */}
        {restaurants.length >= 20 && (
          <div className="text-center mt-4">
            <button className="btn btn-outline-primary btn-lg">
              Load More Restaurants
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurants;