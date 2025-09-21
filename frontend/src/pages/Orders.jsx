import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, RotateCcw, Eye, Filter, Calendar, Search } from 'lucide-react';
import { getOrders, cancelOrder, reorderItems } from '../redux/orderSlice';
import Loading from '../components/Loading';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';
import toast from 'react-hot-toast';

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { orders, isLoading, error } = useSelector((state) => state.orders);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'customer') {
      navigate('/');
      toast.error('Only customers can view orders');
      return;
    }

    dispatch(getOrders());

    // Show success message if coming from checkout
    if (location.state?.orderConfirmation) {
      toast.success('🎉 Order placed successfully!');
      // Clear the state to prevent showing message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [dispatch, isAuthenticated, user, navigate, location.state]);

  useEffect(() => {
    let filtered = orders || [];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchQuery]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': 
      case 'confirmed': 
      case 'preparing': 
        return <Clock size={16} />;
      case 'ready':
      case 'delivered':
        return <CheckCircle size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const canCancelOrder = (order) => {
    const cancelableStatuses = ['pending', 'confirmed'];
    return cancelableStatuses.includes(order.status.toLowerCase());
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await dispatch(cancelOrder(orderId)).unwrap();
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to cancel order');
    }
  };

  const handleReorder = async (order) => {
    try {
      const items = order.items.map(item => ({
        menuItemId: item.menuItem._id,
        quantity: item.quantity,
        customization: item.customization || {}
      }));
      
      await dispatch(reorderItems({ items })).unwrap();
      toast.success('Items added to cart!');
      navigate('/cart');
    } catch (error) {
      toast.error(error.message || 'Failed to reorder items');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const OrderCard = ({ order }) => (
    <div className="card shadow-sm mb-3 hover-shadow">
      <div className="card-body">
        <div className="row">
          <div className="col-md-8">
            <div className="d-flex align-items-start justify-content-between mb-2">
              <div>
                <h6 className="fw-bold mb-1">
                  Order #{order._id.slice(-6)}
                </h6>
                <p className="text-muted mb-1">
                  {order.restaurant?.name || 'Restaurant'}
                </p>
                <small className="text-muted">
                  <Calendar size={14} className="me-1" />
                  {formatDate(order.createdAt)}
                </small>
              </div>
              <span className={`badge bg-${getStatusColor(order.status)} d-flex align-items-center`}>
                {getStatusIcon(order.status)}
                <span className="ms-1">{order.status}</span>
              </span>
            </div>
            
            <div className="mb-2">
              <small className="text-muted">Items: </small>
              <small>{order.items?.map(item => item.menuItem?.name).join(', ')}</small>
            </div>
            
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-bold text-primary">
                ${order.total?.toFixed(2) || '0.00'}
              </span>
              
              <div className="btn-group">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye size={14} className="me-1" />
                  View Details
                </button>
                
                {order.status === 'delivered' && (
                  <button
                    className="btn btn-outline-success btn-sm"
                    onClick={() => handleReorder(order)}
                  >
                    <RotateCcw size={14} className="me-1" />
                    Reorder
                  </button>
                )}
                
                {canCancelOrder(order) && (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleCancelOrder(order._id)}
                  >
                    <XCircle size={14} className="me-1" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-4 text-md-end">
            <div className="order-tracking">
              <small className="text-muted d-block mb-1">Order Progress</small>
              <div className="progress mb-2" style={{ height: '6px' }}>
                <div 
                  className={`progress-bar bg-${getStatusColor(order.status)}`}
                  style={{ 
                    width: order.status === 'delivered' ? '100%' : 
                           order.status === 'ready' ? '80%' :
                           order.status === 'preparing' ? '60%' :
                           order.status === 'confirmed' ? '40%' :
                           order.status === 'pending' ? '20%' : '0%'
                  }}
                />
              </div>
              {order.estimatedDeliveryTime && (
                <small className="text-muted">
                  <Clock size={12} className="me-1" />
                  Est: {formatDate(order.estimatedDeliveryTime)}
                </small>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <Loading size="lg" text="Loading your orders..." fullScreen={true} />;
  }

  if (error) {
    return (
      <div className="container py-5">
        <ErrorMessage 
          error={error} 
          onRetry={() => dispatch(getOrders())} 
        />
      </div>
    );
  }

  return (
    <div className="orders-page bg-light min-vh-100">
      <div className="container py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">My Orders</h2>
                <p className="text-muted mb-0">
                  {orders?.length || 0} order{(orders?.length || 0) !== 1 ? 's' : ''} total
                </p>
              </div>
              
              <button 
                className="btn btn-outline-primary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} className="me-1" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Search Orders</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Search size={18} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Order ID or restaurant name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <button 
                className="btn btn-link p-0"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            title={orders?.length === 0 ? "No orders yet" : "No matching orders"}
            message={
              orders?.length === 0 
                ? "You haven't placed any orders yet. Start browsing restaurants!"
                : "Try adjusting your filters or search query."
            }
            action={
              orders?.length === 0 ? (
                <Link to="/restaurants" className="btn btn-primary">
                  <Package className="me-2" size={18} />
                  Browse Restaurants
                </Link>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </button>
              )
            }
          />
        ) : (
          <div className="row">
            <div className="col-12">
              {filteredOrders.map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Order Details - #{selectedOrder._id.slice(-6)}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedOrder(null)}
                  />
                </div>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-sm-6">
                      <strong>Restaurant:</strong> {selectedOrder.restaurant?.name}
                    </div>
                    <div className="col-sm-6">
                      <strong>Status:</strong> 
                      <span className={`badge bg-${getStatusColor(selectedOrder.status)} ms-2`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-sm-6">
                      <strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}
                    </div>
                    <div className="col-sm-6">
                      <strong>Total:</strong> ${selectedOrder.total?.toFixed(2)}
                    </div>
                  </div>

                  {selectedOrder.deliveryAddress && (
                    <div className="mb-3">
                      <strong>Delivery Address:</strong>
                      <address className="mt-1">
                        {selectedOrder.deliveryAddress.street}<br />
                        {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}
                      </address>
                    </div>
                  )}

                  <div className="mb-3">
                    <strong>Items:</strong>
                    <div className="mt-2">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="d-flex justify-content-between border-bottom py-2">
                          <div>
                            <span className="fw-bold">{item.menuItem?.name}</span>
                            <small className="text-muted d-block">
                              Quantity: {item.quantity}
                            </small>
                            {item.customization && Object.keys(item.customization).length > 0 && (
                              <small className="text-muted d-block">
                                Customizations: {Object.entries(item.customization).map(([k, v]) => `${k}: ${v}`).join(', ')}
                              </small>
                            )}
                          </div>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedOrder.orderNotes && (
                    <div className="mb-3">
                      <strong>Order Notes:</strong>
                      <p className="mt-1">{selectedOrder.orderNotes}</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  {selectedOrder.status === 'delivered' && (
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        handleReorder(selectedOrder);
                        setSelectedOrder(null);
                      }}
                    >
                      <RotateCcw size={16} className="me-1" />
                      Reorder
                    </button>
                  )}
                  
                  {canCancelOrder(selectedOrder) && (
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        handleCancelOrder(selectedOrder._id);
                        setSelectedOrder(null);
                      }}
                    >
                      <XCircle size={16} className="me-1" />
                      Cancel Order
                    </button>
                  )}
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;