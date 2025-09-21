import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, Users, ShoppingBag, Store, TrendingUp, Calendar, 
  DollarSign, Package, Clock, AlertCircle, ChevronRight, Eye 
} from 'lucide-react';
import { getOrders } from '../redux/orderSlice';
import { getRestaurants } from '../redux/restaurantSlice';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { orders, isLoading: ordersLoading } = useSelector((state) => state.orders);
  const { restaurants, isLoading: restaurantsLoading } = useSelector((state) => state.restaurants);
  
  const [adminStats, setAdminStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalRestaurants: 0,
    totalUsers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    avgOrderValue: 0,
    topRestaurants: []
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      toast.error('Access denied. Admin privileges required.');
      return;
    }

    // Load data
    dispatch(getOrders());
    dispatch(getRestaurants());
  }, [dispatch, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (orders && restaurants) {
      const stats = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
        totalRestaurants: restaurants.length,
        totalUsers: 150, // This would come from a users API in real app
        pendingOrders: orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status?.toLowerCase())).length,
        completedOrders: orders.filter(o => o.status?.toLowerCase() === 'delivered').length,
        avgOrderValue: orders.length > 0 ? (orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length) : 0,
        topRestaurants: restaurants
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 5)
      };
      setAdminStats(stats);
    }
  }, [orders, restaurants]);

  const recentOrders = orders?.slice(0, 5) || [];

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (ordersLoading || restaurantsLoading) {
    return <Loading size="lg" text="Loading admin dashboard..." fullScreen={true} />;
  }

  return (
    <div className="admin-panel bg-light min-vh-100">
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-1">Admin Dashboard</h2>
                <p className="text-muted mb-0">
                  Welcome back, {user?.name} • {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div className="text-end">
                <Link to="/admin/profile" className="btn btn-outline-primary btn-sm me-2">
                  Profile
                </Link>
                <Link to="/admin/settings" className="btn btn-primary btn-sm">
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="row mb-4">
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="text-muted mb-1">Total Revenue</h6>
                    <h3 className="mb-0 text-success">{formatCurrency(adminStats.totalRevenue)}</h3>
                  </div>
                  <DollarSign size={32} className="text-success" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="text-muted mb-1">Total Orders</h6>
                    <h3 className="mb-0">{adminStats.totalOrders}</h3>
                    <small className="text-muted">
                      {adminStats.pendingOrders} pending
                    </small>
                  </div>
                  <Package size={32} className="text-primary" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="text-muted mb-1">Restaurants</h6>
                    <h3 className="mb-0">{adminStats.totalRestaurants}</h3>
                    <small className="text-success">
                      Active partners
                    </small>
                  </div>
                  <Store size={32} className="text-info" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <h6 className="text-muted mb-1">Average Order</h6>
                    <h3 className="mb-0">{formatCurrency(adminStats.avgOrderValue)}</h3>
                    <small className="text-muted">
                      Per order value
                    </small>
                  </div>
                  <TrendingUp size={32} className="text-warning" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Recent Orders */}
          <div className="col-xl-8 mb-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Orders</h5>
                <Link to="/admin/orders" className="btn btn-link p-0">
                  View All <ChevronRight size={16} />
                </Link>
              </div>
              <div className="card-body p-0">
                {recentOrders.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <Package size={48} className="mb-3 opacity-50" />
                    <p>No recent orders found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Restaurant</th>
                          <th>Status</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order._id}>
                            <td>
                              <span className="fw-bold">#{order._id.slice(-6)}</span>
                            </td>
                            <td>
                              <div>
                                <div className="fw-bold">{order.customer?.name || 'Customer'}</div>
                                <small className="text-muted">{order.customer?.email}</small>
                              </div>
                            </td>
                            <td>{order.restaurant?.name || 'Restaurant'}</td>
                            <td>
                              <span className={`badge bg-${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="fw-bold">{formatCurrency(order.total || 0)}</td>
                            <td>
                              <small>{formatDate(order.createdAt)}</small>
                            </td>
                            <td>
                              <Link to={`/admin/orders/${order._id}`} className="btn btn-sm btn-outline-primary">
                                <Eye size={14} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="row mt-3">
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <Clock className="text-warning mb-2" size={24} />
                    <h5>{adminStats.pendingOrders}</h5>
                    <small className="text-muted">Pending Orders</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <Package className="text-success mb-2" size={24} />
                    <h5>{adminStats.completedOrders}</h5>
                    <small className="text-muted">Completed Orders</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <Users className="text-info mb-2" size={24} />
                    <h5>{adminStats.totalUsers}</h5>
                    <small className="text-muted">Total Users</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-xl-4">
            {/* Top Restaurants */}
            <div className="card mb-3">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Top Restaurants</h6>
                <Link to="/admin/restaurants" className="btn btn-link btn-sm p-0">
                  Manage
                </Link>
              </div>
              <div className="card-body p-0">
                {adminStats.topRestaurants.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    <p className="mb-0">No restaurants found</p>
                  </div>
                ) : (
                  adminStats.topRestaurants.map((restaurant, index) => (
                    <div key={restaurant._id} className="p-3 border-bottom d-flex align-items-center">
                      <div className="me-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                             style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{restaurant.name}</h6>
                        <div className="d-flex align-items-center">
                          <span className="text-warning me-1">★</span>
                          <small className="text-muted">{restaurant.rating || '4.5'}</small>
                          <small className="text-muted ms-2">• {restaurant.cuisine || 'Various'}</small>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Quick Actions</h6>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <Link to="/admin/restaurants/new" className="btn btn-primary">
                    <Store className="me-2" size={16} />
                    Add Restaurant
                  </Link>
                  <Link to="/admin/orders" className="btn btn-outline-primary">
                    <Package className="me-2" size={16} />
                    Manage Orders
                  </Link>
                  <Link to="/admin/users" className="btn btn-outline-secondary">
                    <Users className="me-2" size={16} />
                    Manage Users
                  </Link>
                  <Link to="/admin/analytics" className="btn btn-outline-info">
                    <BarChart3 className="me-2" size={16} />
                    View Analytics
                  </Link>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">System Status</h6>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span>Platform Status</span>
                  <span className="badge bg-success">Online</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span>Database</span>
                  <span className="badge bg-success">Connected</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span>Payment Gateway</span>
                  <span className="badge bg-success">Active</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span>Email Service</span>
                  <span className="badge bg-warning">Maintenance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Management Links */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Management Dashboard</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <Link to="/admin/restaurants" className="text-decoration-none">
                      <div className="card h-100 hover-shadow">
                        <div className="card-body text-center">
                          <Store className="text-primary mb-2" size={32} />
                          <h6>Restaurants</h6>
                          <p className="text-muted small mb-0">Manage restaurant partners</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="col-md-3 mb-3">
                    <Link to="/admin/orders" className="text-decoration-none">
                      <div className="card h-100 hover-shadow">
                        <div className="card-body text-center">
                          <ShoppingBag className="text-success mb-2" size={32} />
                          <h6>Orders</h6>
                          <p className="text-muted small mb-0">Track and manage orders</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="col-md-3 mb-3">
                    <Link to="/admin/users" className="text-decoration-none">
                      <div className="card h-100 hover-shadow">
                        <div className="card-body text-center">
                          <Users className="text-info mb-2" size={32} />
                          <h6>Users</h6>
                          <p className="text-muted small mb-0">User management</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="col-md-3 mb-3">
                    <Link to="/admin/analytics" className="text-decoration-none">
                      <div className="card h-100 hover-shadow">
                        <div className="card-body text-center">
                          <BarChart3 className="text-warning mb-2" size={32} />
                          <h6>Analytics</h6>
                          <p className="text-muted small mb-0">Reports and insights</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;