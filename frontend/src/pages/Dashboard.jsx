import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, Package, Star, TrendingUp, Clock, Heart, 
  MapPin, User, ChevronRight, Eye, RotateCcw, DollarSign 
} from 'lucide-react';
import { getOrders } from '../redux/orderSlice';
import { getRestaurants } from '../redux/restaurantSlice';
import Loading from '../components/Loading';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { orders, isLoading: ordersLoading } = useSelector((state) => state.orders);
  const { restaurants, isLoading: restaurantsLoading } = useSelector((state) => state.restaurants);
  
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'customer') {
      navigate('/');
      toast.error('Only customers can access dashboard');
      return;
    }

    // Load initial data
    dispatch(getOrders());
    dispatch(getRestaurants());
  }, [dispatch, isAuthenticated, user, navigate]);

  useEffect(() => {
    // Simulate favorite restaurants (in real app, this would come from user preferences)
    if (restaurants && restaurants.length > 0) {
      const favorites = restaurants
        .filter(r => r.rating >= 4.5)
        .slice(0, 4);
      setFavoriteRestaurants(favorites);
    }

    // Generate recent activity from orders
    if (orders && orders.length > 0) {
      const activity = orders
        .slice(0, 5)
        .map(order => ({
          id: order._id,
          type: 'order',
          message: `Order from ${order.restaurant?.name || 'Restaurant'}`,
          timestamp: order.createdAt,
          status: order.status,
          amount: order.total
        }));
      setRecentActivity(activity);
    }
  }, [restaurants, orders]);

  // Calculate dashboard stats
  const dashboardStats = {
    totalOrders: orders?.length || 0,
    completedOrders: orders?.filter(o => o.status === 'delivered')?.length || 0,
    totalSpent: orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0,
    averageOrderValue: orders?.length > 0 
      ? (orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length) 
      : 0
  };

  const recentOrders = orders?.slice(0, 3) || [];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={14} fill="currentColor" className="text-warning" />);
    }
    
    const emptyStars = 5 - fullStars;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={14} className="text-muted" />);
    }
    
    return stars;
  };

  if (ordersLoading || restaurantsLoading) {
    return <Loading size="lg" text="Loading your dashboard..." fullScreen={true} />;
  }

  return (
    <div className="dashboard-page bg-light min-vh-100">
      <div className="container py-4">
        {/* Welcome Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-1">Welcome back, {user?.name}! 👋</h2>
                <p className="text-muted mb-0">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div className="text-end">
                <Link to="/profile" className="btn btn-outline-primary btn-sm">
                  <User size={16} className="me-1" />
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <Package className="text-primary mb-2" size={32} />
                <h4 className="fw-bold mb-1">{dashboardStats.totalOrders}</h4>
                <p className="text-muted mb-0">Total Orders</p>
              </div>
            </div>
          </div>
          
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <TrendingUp className="text-success mb-2" size={32} />
                <h4 className="fw-bold mb-1">{dashboardStats.completedOrders}</h4>
                <p className="text-muted mb-0">Completed Orders</p>
              </div>
            </div>
          </div>
          
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <DollarSign className="text-info mb-2" size={32} />
                <h4 className="fw-bold mb-1">${dashboardStats.totalSpent.toFixed(2)}</h4>
                <p className="text-muted mb-0">Total Spent</p>
              </div>
            </div>
          </div>
          
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <Star className="text-warning mb-2" size={32} />
                <h4 className="fw-bold mb-1">${dashboardStats.averageOrderValue.toFixed(2)}</h4>
                <p className="text-muted mb-0">Avg Order Value</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Recent Orders */}
          <div className="col-lg-8 mb-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Orders</h5>
                <Link to="/orders" className="btn btn-link p-0 text-decoration-none">
                  View All <ChevronRight size={16} />
                </Link>
              </div>
              <div className="card-body p-0">
                {recentOrders.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      title="No orders yet"
                      message="Start exploring restaurants to place your first order!"
                      action={
                        <Link to="/restaurants" className="btn btn-primary">
                          <ShoppingCart className="me-2" size={18} />
                          Browse Restaurants
                        </Link>
                      }
                    />
                  </div>
                ) : (
                  recentOrders.map((order, index) => (
                    <div key={order._id} className={`p-3 d-flex align-items-center justify-content-between ${index < recentOrders.length - 1 ? 'border-bottom' : ''}`}>
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <Package className="text-primary" size={24} />
                        </div>
                        <div>
                          <h6 className="mb-1">Order #{order._id.slice(-6)}</h6>
                          <p className="text-muted mb-0 small">
                            {order.restaurant?.name || 'Restaurant'} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-end">
                        <span className={`badge bg-${getStatusColor(order.status)} mb-1`}>
                          {order.status}
                        </span>
                        <p className="mb-0 fw-bold">${order.total?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">Quick Actions</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <Link to="/restaurants" className="btn btn-outline-primary w-100">
                      <ShoppingCart className="me-2" size={18} />
                      Browse Restaurants
                    </Link>
                  </div>
                  <div className="col-md-6 mb-2">
                    <Link to="/search" className="btn btn-outline-secondary w-100">
                      <MapPin className="me-2" size={18} />
                      Search Food
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Favorite Restaurants */}
            <div className="card mb-3">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <Heart className="me-2" size={18} />
                  Top Rated Restaurants
                </h6>
                <Link to="/restaurants" className="btn btn-link btn-sm p-0">
                  View More
                </Link>
              </div>
              <div className="card-body p-0">
                {favoriteRestaurants.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    <p className="mb-0">No restaurants to show yet</p>
                  </div>
                ) : (
                  favoriteRestaurants.map((restaurant) => (
                    <Link 
                      key={restaurant._id} 
                      to={`/restaurant/${restaurant._id}`}
                      className="text-decoration-none"
                    >
                      <div className="p-3 border-bottom hover-bg-light">
                        <div className="d-flex align-items-center">
                          <img
                            src={restaurant.image || '/api/placeholder/50/50'}
                            alt={restaurant.name}
                            className="rounded me-3"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{restaurant.name}</h6>
                            <div className="d-flex align-items-center">
                              {getRatingStars(restaurant.rating || 4.5)}
                              <span className="ms-2 text-muted small">
                                ({restaurant.rating || '4.5'})
                              </span>
                            </div>
                            <p className="text-muted mb-0 small">
                              <Clock size={12} className="me-1" />
                              {restaurant.deliveryTime || '30-45'} min
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Recent Activity</h6>
              </div>
              <div className="card-body p-0">
                {recentActivity.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    <p className="mb-0">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="p-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <div className="me-2 mt-1">
                          <div className={`rounded-circle bg-${getStatusColor(activity.status)} d-flex align-items-center justify-content-center`}
                               style={{ width: '8px', height: '8px' }}>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-1 small">{activity.message}</p>
                          <p className="text-muted mb-0 small">
                            {formatDate(activity.timestamp)} • ${activity.amount?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        {favoriteRestaurants.length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Recommended for You</h5>
                  <small className="text-muted">Based on your order history</small>
                </div>
                <div className="card-body">
                  <div className="row">
                    {favoriteRestaurants.slice(0, 3).map((restaurant) => (
                      <div key={restaurant._id} className="col-md-4 mb-3">
                        <Link to={`/restaurant/${restaurant._id}`} className="text-decoration-none">
                          <div className="card h-100 shadow-sm hover-shadow">
                            <img
                              src={restaurant.image || '/api/placeholder/300/200'}
                              className="card-img-top"
                              alt={restaurant.name}
                              style={{ height: '150px', objectFit: 'cover' }}
                            />
                            <div className="card-body">
                              <h6 className="card-title">{restaurant.name}</h6>
                              <div className="d-flex align-items-center mb-2">
                                {getRatingStars(restaurant.rating || 4.5)}
                                <span className="ms-2 text-muted small">({restaurant.rating || '4.5'})</span>
                              </div>
                              <div className="d-flex justify-content-between text-muted small">
                                <span>
                                  <Clock size={14} className="me-1" />
                                  {restaurant.deliveryTime || '30-45'} min
                                </span>
                                <span>{restaurant.cuisine || 'Various'}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;