import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search as SearchIcon, Filter, MapPin, Clock, Star, DollarSign, Utensils, Coffee } from 'lucide-react';
import { getRestaurants } from '../redux/restaurantSlice';
import Loading from '../components/Loading';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  
  const { restaurants, menuItems, isLoading, error } = useSelector((state) => state.restaurants);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'all');
  const [filters, setFilters] = useState({
    cuisine: searchParams.get('cuisine') || '',
    city: searchParams.get('city') || '',
    rating: searchParams.get('rating') || '',
    priceRange: searchParams.get('price') || '',
    deliveryTime: searchParams.get('delivery') || '',
    isOpen: searchParams.get('open') === 'true'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState({
    restaurants: [],
    menuItems: []
  });

  // Available filter options
  const cuisineTypes = ['Italian', 'Chinese', 'Mexican', 'Indian', 'American', 'Thai', 'Japanese', 'Mediterranean', 'Fast Food'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];

  useEffect(() => {
    // Load initial data
    dispatch(getRestaurants());
  }, [dispatch]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchType !== 'all') params.set('type', searchType);
    if (filters.cuisine) params.set('cuisine', filters.cuisine);
    if (filters.city) params.set('city', filters.city);
    if (filters.rating) params.set('rating', filters.rating);
    if (filters.priceRange) params.set('price', filters.priceRange);
    if (filters.deliveryTime) params.set('delivery', filters.deliveryTime);
    if (filters.isOpen) params.set('open', 'true');
    
    setSearchParams(params);
  }, [searchQuery, searchType, filters, setSearchParams]);

  const hasActiveFilters = useCallback(() => {
    return filters.cuisine || filters.city || filters.rating || 
           filters.priceRange || filters.deliveryTime || filters.isOpen;
  }, [filters]);

  // Perform search with filters
  useEffect(() => {
    if (!searchQuery.trim() && !hasActiveFilters()) {
      setSearchResults({ restaurants: [], menuItems: [] });
      return;
    }

    let filteredRestaurants = restaurants || [];
    let filteredMenuItems = menuItems || [];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.description?.toLowerCase().includes(query) ||
        restaurant.cuisine?.toLowerCase().includes(query)
      );

      filteredMenuItems = filteredMenuItems.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.cuisine) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.cuisine?.toLowerCase() === filters.cuisine.toLowerCase()
      );
    }

    if (filters.city) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.address?.city?.toLowerCase() === filters.city.toLowerCase()
      );
    }

    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filteredRestaurants = filteredRestaurants.filter(r => 
        (r.rating || 0) >= minRating
      );
    }

    if (filters.priceRange) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.priceRange === filters.priceRange
      );
    }

    if (filters.deliveryTime) {
      const maxTime = parseInt(filters.deliveryTime);
      filteredRestaurants = filteredRestaurants.filter(r => 
        parseInt(r.deliveryTime || '45') <= maxTime
      );
    }

    if (filters.isOpen) {
      filteredRestaurants = filteredRestaurants.filter(r => r.isOpen);
    }

    // Filter search type
    const results = {
      restaurants: searchType === 'menu' ? [] : filteredRestaurants,
      menuItems: searchType === 'restaurants' ? [] : filteredMenuItems
    };

    setSearchResults(results);
  }, [searchQuery, restaurants, menuItems, filters, searchType, hasActiveFilters]);

  const clearAllFilters = () => {
    setFilters({
      cuisine: '',
      city: '',
      rating: '',
      priceRange: '',
      deliveryTime: '',
      isOpen: false
    });
    setSearchQuery('');
    setSearchType('all');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is performed automatically via useEffect
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={14} fill="currentColor" className="text-warning" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" size={14} fill="currentColor" className="text-warning" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={14} className="text-muted" />);
    }
    
    return stars;
  };

  const totalResults = searchResults.restaurants.length + searchResults.menuItems.length;

  if (isLoading) {
    return <Loading size="lg" text="Searching..." fullScreen={true} />;
  }

  return (
    <div className="search-page bg-light min-vh-100">
      <div className="container py-4">
        {/* Search Header */}
        <div className="row mb-4">
          <div className="col-12">
            <form onSubmit={handleSearch}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-lg-8 mb-3 mb-lg-0">
                      <div className="input-group input-group-lg">
                        <span className="input-group-text">
                          <SearchIcon size={20} />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search restaurants, dishes, or cuisines..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                          Search
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-lg-4">
                      <div className="d-flex gap-2">
                        <select
                          className="form-select"
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                        >
                          <option value="all">All Results</option>
                          <option value="restaurants">Restaurants Only</option>
                          <option value="menu">Menu Items Only</option>
                        </select>
                        
                        <button
                          type="button"
                          className={`btn btn-outline-primary ${showFilters ? 'active' : ''}`}
                          onClick={() => setShowFilters(!showFilters)}
                        >
                          <Filter size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Filters</h6>
                    <button 
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={clearAllFilters}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-lg-3 mb-3">
                      <label className="form-label">Cuisine</label>
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
                    
                    <div className="col-lg-3 mb-3">
                      <label className="form-label">City</label>
                      <select
                        className="form-select"
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                      >
                        <option value="">All Cities</option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-lg-2 mb-3">
                      <label className="form-label">Min Rating</label>
                      <select
                        className="form-select"
                        value={filters.rating}
                        onChange={(e) => handleFilterChange('rating', e.target.value)}
                      >
                        <option value="">Any Rating</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                        <option value="2">2+ Stars</option>
                      </select>
                    </div>
                    
                    <div className="col-lg-2 mb-3">
                      <label className="form-label">Price Range</label>
                      <select
                        className="form-select"
                        value={filters.priceRange}
                        onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                      >
                        <option value="">Any Price</option>
                        <option value="$">$ - Budget</option>
                        <option value="$$">$$ - Moderate</option>
                        <option value="$$$">$$$ - Expensive</option>
                      </select>
                    </div>
                    
                    <div className="col-lg-2 mb-3">
                      <label className="form-label">Delivery Time</label>
                      <select
                        className="form-select"
                        value={filters.deliveryTime}
                        onChange={(e) => handleFilterChange('deliveryTime', e.target.value)}
                      >
                        <option value="">Any Time</option>
                        <option value="30">Under 30 min</option>
                        <option value="45">Under 45 min</option>
                        <option value="60">Under 1 hour</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={filters.isOpen}
                      onChange={(e) => handleFilterChange('isOpen', e.target.checked)}
                    />
                    <label className="form-check-label">
                      Open now only
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(searchQuery || hasActiveFilters()) && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <small className="text-muted">Active filters:</small>
                
                {searchQuery && (
                  <span className="badge bg-primary d-flex align-items-center">
                    Search: "{searchQuery}"
                    <button
                      className="btn-close btn-close-white ms-2"
                      style={{ fontSize: '0.6em' }}
                      onClick={() => setSearchQuery('')}
                    />
                  </span>
                )}
                
                {Object.entries(filters).map(([key, value]) => 
                  value && value !== false ? (
                    <span key={key} className="badge bg-secondary d-flex align-items-center">
                      {key}: {typeof value === 'boolean' ? 'Yes' : value}
                      <button
                        className="btn-close btn-close-white ms-2"
                        style={{ fontSize: '0.6em' }}
                        onClick={() => handleFilterChange(key, key === 'isOpen' ? false : '')}
                      />
                    </span>
                  ) : null
                )}
                
                <button 
                  className="btn btn-link btn-sm p-0 text-danger"
                  onClick={clearAllFilters}
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="row mb-3">
          <div className="col-12">
            <h5>
              {totalResults > 0 ? (
                <>
                  {totalResults} result{totalResults !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </>
              ) : (
                'No results found'
              )}
            </h5>
            {searchResults.restaurants.length > 0 && (
              <small className="text-muted">
                {searchResults.restaurants.length} restaurant{searchResults.restaurants.length !== 1 ? 's' : ''}
                {searchResults.menuItems.length > 0 && `, ${searchResults.menuItems.length} menu item${searchResults.menuItems.length !== 1 ? 's' : ''}`}
              </small>
            )}
          </div>
        </div>

        {/* Search Results */}
        {error ? (
          <ErrorMessage error={error} onRetry={() => dispatch(getRestaurants())} />
        ) : totalResults === 0 && (searchQuery || hasActiveFilters()) ? (
          <EmptyState
            title="No results found"
            message="Try adjusting your search query or filters to find what you're looking for."
            action={
              <button className="btn btn-primary" onClick={clearAllFilters}>
                Clear Filters
              </button>
            }
          />
        ) : (
          <div className="row">
            {/* Restaurants Results */}
            {searchResults.restaurants.length > 0 && (
              <div className="col-12 mb-4">
                <h6 className="mb-3">
                  <Utensils className="me-2" size={18} />
                  Restaurants ({searchResults.restaurants.length})
                </h6>
                <div className="row">
                  {searchResults.restaurants.map((restaurant) => (
                    <div key={restaurant._id} className="col-md-6 col-lg-4 mb-3">
                      <Link to={`/restaurant/${restaurant._id}`} className="text-decoration-none">
                        <div className="card h-100 shadow-sm hover-shadow">
                          <img
                            src={restaurant.image || '/api/placeholder/300/200'}
                            className="card-img-top"
                            alt={restaurant.name}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <div className="card-body">
                            <h6 className="card-title">{restaurant.name}</h6>
                            <p className="card-text text-muted small">{restaurant.description}</p>
                            
                            <div className="d-flex align-items-center mb-2">
                              {getRatingStars(restaurant.rating || 4.0)}
                              <span className="ms-2 text-muted">({restaurant.rating || '4.0'})</span>
                            </div>
                            
                            <div className="d-flex justify-content-between text-muted small">
                              <span>
                                <Clock size={14} className="me-1" />
                                {restaurant.deliveryTime || '30-45'} min
                              </span>
                              <span>
                                <DollarSign size={14} className="me-1" />
                                {restaurant.priceRange || '$$'}
                              </span>
                            </div>
                            
                            {restaurant.address?.city && (
                              <div className="text-muted small mt-1">
                                <MapPin size={14} className="me-1" />
                                {restaurant.address.city}
                              </div>
                            )}
                          </div>
                          
                          {restaurant.isOpen && (
                            <div className="card-footer bg-transparent">
                              <small className="text-success">• Open now</small>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Items Results */}
            {searchResults.menuItems.length > 0 && (
              <div className="col-12">
                <h6 className="mb-3">
                  <Coffee className="me-2" size={18} />
                  Menu Items ({searchResults.menuItems.length})
                </h6>
                <div className="row">
                  {searchResults.menuItems.map((item) => (
                    <div key={item._id} className="col-md-6 col-lg-4 mb-3">
                      <Link to={`/restaurant/${item.restaurant}`} className="text-decoration-none">
                        <div className="card h-100 shadow-sm hover-shadow">
                          <img
                            src={item.image || '/api/placeholder/300/200'}
                            className="card-img-top"
                            alt={item.name}
                            style={{ height: '150px', objectFit: 'cover' }}
                          />
                          <div className="card-body">
                            <h6 className="card-title">{item.name}</h6>
                            <p className="card-text text-muted small">{item.description}</p>
                            
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-success fw-bold">${item.price}</span>
                              <span className="badge bg-secondary">{item.category}</span>
                            </div>
                            
                            <div className="d-flex align-items-center mt-2">
                              {getRatingStars(item.rating || 4.0)}
                              <span className="ms-2 text-muted small">({item.rating || '4.0'})</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No search performed yet */}
        {!searchQuery && !hasActiveFilters() && (
          <EmptyState
            title="Start your search"
            message="Search for restaurants, dishes, or cuisines to find delicious food near you."
            action={
              <div className="d-flex flex-column align-items-center">
                <p className="text-muted mb-3">Popular searches:</p>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {['Pizza', 'Burger', 'Sushi', 'Chinese', 'Italian'].map(term => (
                    <button
                      key={term}
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setSearchQuery(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
};

export default Search;