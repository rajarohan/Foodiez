import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, MapPin, Clock, Star, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { getRestaurants } from '../redux/restaurantSlice';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const Home = () => {
  const dispatch = useDispatch();
  const { restaurants, isLoading, error } = useSelector((state) => state.restaurants);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch featured restaurants on component mount
    dispatch(getRestaurants({ featured: true, limit: 6 }));
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const featuredRestaurants = restaurants.slice(0, 6);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="bg-primary text-white py-5 mb-5">
        <div className="container">
          <div className="row align-items-center min-vh-50">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-3">
                Delicious Food, Delivered Fast
              </h1>
              <p className="lead mb-4">
                Order from your favorite restaurants and get fresh, hot meals 
                delivered right to your doorstep in minutes.
              </p>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-white">
                    <MapPin size={24} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your delivery address"
                    style={{ borderLeft: 'none', borderRight: 'none' }}
                  />
                  <span className="input-group-text bg-white">
                    <Search size={24} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search for restaurants or dishes"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn btn-warning btn-lg fw-bold" type="submit">
                    Find Food
                  </button>
                </div>
              </form>

              <div className="d-flex flex-wrap gap-2 mb-4">
                <span className="badge bg-light text-dark p-2">
                  <Clock size={16} className="me-1" />
                  30 min delivery
                </span>
                <span className="badge bg-light text-dark p-2">
                  <Star size={16} className="me-1" />
                  Top rated restaurants
                </span>
                <span className="badge bg-light text-dark p-2">
                  <UtensilsCrossed size={16} className="me-1" />
                  1000+ dishes
                </span>
              </div>

              {!isAuthenticated && (
                <div className="d-flex gap-3">
                  <Link to="/register" className="btn btn-warning btn-lg">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg">
                    Sign In
                  </Link>
                </div>
              )}
            </div>
            <div className="col-lg-6 text-center">
              <div className="hero-image">
                <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center" 
                     style={{ width: '300px', height: '300px' }}>
                  <UtensilsCrossed size={120} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Restaurants Section */}
      <section className="container mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h3 fw-bold">Featured Restaurants</h2>
          <Link to="/restaurants" className="btn btn-outline-primary">
            View All
            <ArrowRight size={16} className="ms-1" />
          </Link>
        </div>

        {isLoading ? (
          <Loading size="lg" text="Loading restaurants..." />
        ) : error ? (
          <ErrorMessage error={error} onRetry={() => dispatch(getRestaurants({ featured: true, limit: 6 }))} />
        ) : (
          <div className="row">
            {featuredRestaurants.length > 0 ? (
              featuredRestaurants.map((restaurant) => (
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
                        <span className="badge bg-success">
                          <Star size={12} className="me-1" />
                          {restaurant.rating || '4.5'}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <h5 className="card-title fw-bold">{restaurant.name}</h5>
                      <p className="card-text text-muted">
                        {restaurant.cuisine} • {restaurant.address?.city || 'City'}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center text-muted">
                          <Clock size={16} className="me-1" />
                          <small>{restaurant.deliveryTime || '30-45'} min</small>
                        </div>
                        <div className="text-muted">
                          <small>Delivery: ${restaurant.deliveryFee || '2.99'}</small>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent">
                      <Link 
                        to={`/restaurants/${restaurant._id}`} 
                        className="btn btn-primary w-100"
                      >
                        View Menu
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5">
                <UtensilsCrossed size={64} className="text-muted mb-3" />
                <h5 className="text-muted">No restaurants available</h5>
                <p className="text-muted">Check back later for delicious options!</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-light py-5">
        <div className="container">
          <div className="row text-center">
            <div className="col-lg-4 mb-4">
              <div className="feature-item">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                     style={{ width: '80px', height: '80px' }}>
                  <Search size={32} />
                </div>
                <h4>Easy Ordering</h4>
                <p className="text-muted">
                  Browse menus, customize your order, and checkout in just a few clicks.
                </p>
              </div>
            </div>
            <div className="col-lg-4 mb-4">
              <div className="feature-item">
                <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                     style={{ width: '80px', height: '80px' }}>
                  <Clock size={32} />
                </div>
                <h4>Fast Delivery</h4>
                <p className="text-muted">
                  Get your food delivered hot and fresh in 30 minutes or less.
                </p>
              </div>
            </div>
            <div className="col-lg-4 mb-4">
              <div className="feature-item">
                <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                     style={{ width: '80px', height: '80px' }}>
                  <Star size={32} />
                </div>
                <h4>Quality Food</h4>
                <p className="text-muted">
                  Partner with top-rated restaurants to ensure the best quality meals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;