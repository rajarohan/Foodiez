import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  StarIcon as StarOutline
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import api from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const orderStatuses = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    pending: ClockIcon,
    confirmed: CheckCircleIcon,
    preparing: ClockIcon,
    ready: CheckCircleIcon,
    delivered: CheckCircleIcon,
    cancelled: XCircleIcon
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.orders.getUserOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await api.orders.cancel(orderId, 'Customer requested cancellation');
      await fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Failed to cancel order');
    }
  };

  const submitRating = async (orderId) => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    try {
      await api.orders.addRating(orderId, {
        rating,
        review: review.trim()
      });
      
      // Update the order in the list
      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, rating: { rating, review: review.trim() } }
          : order
      ));
      
      // Update selected order if it's open
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          rating: { rating, review: review.trim() }
        });
      }
      
      setRating(0);
      setReview('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
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

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const renderStars = (currentRating, interactive = false, onRate = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const StarIcon = i <= currentRating ? StarSolid : StarOutline;
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => interactive && onRate && onRate(i)}
          className={`${interactive ? 'hover:text-yellow-400' : ''} ${
            i <= currentRating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          disabled={!interactive}
        >
          <StarIcon className="h-5 w-5" />
        </button>
      );
    }
    return stars;
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your food orders</p>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {orderStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All Orders' : status}
                {status !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({orders.filter(order => order.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all' 
                ? "You haven't placed any orders yet." 
                : `No orders with status "${statusFilter}".`
              }
            </p>
            <Link to="/restaurants" className="btn-primary">
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status];
              return (
                <div key={order._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Restaurant</p>
                      <p className="text-sm text-gray-600">{order.restaurant.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Items</p>
                      <p className="text-sm text-gray-600">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Total</p>
                      <p className="text-lg font-semibold text-gray-900">${calculateTotal(order.items)}</p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <span key={index} className="text-sm text-gray-600">
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-sm text-gray-500">
                          +{order.items.length - 3} more items
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => cancelOrder(order._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel Order
                      </button>
                    )}
                    {order.status === 'delivered' && !order.rating && (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {renderStars(rating, true, setRating)}
                        </div>
                        <input
                          type="text"
                          placeholder="Write a review..."
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => submitRating(order._id)}
                          disabled={submittingRating || rating === 0}
                          className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
                        >
                          Rate
                        </button>
                      </div>
                    )}
                    {order.rating && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Your rating:</span>
                        <div className="flex">
                          {renderStars(order.rating.rating)}
                        </div>
                        {order.rating.review && (
                          <span className="text-sm text-gray-600">"{order.rating.review}"</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Detail Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Order Status */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Status</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>

                  {/* Restaurant Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Restaurant</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">{selectedOrder.restaurant.name}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.restaurant.address}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-300">
                        <p className="font-semibold">Total:</p>
                        <p className="font-bold text-lg">${calculateTotal(selectedOrder.items)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p>{selectedOrder.deliveryAddress.street}</p>
                      <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}</p>
                    </div>
                  </div>

                  {/* Order Timeline */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Timeline</h4>
                    <div className="bg-gray-50 p-3 rounded-md text-sm">
                      <p><span className="font-medium">Order Placed:</span> {formatDate(selectedOrder.createdAt)}</p>
                      <p><span className="font-medium">Last Updated:</span> {formatDate(selectedOrder.updatedAt)}</p>
                      {selectedOrder.estimatedDeliveryTime && (
                        <p><span className="font-medium">Estimated Delivery:</span> {formatDate(selectedOrder.estimatedDeliveryTime)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
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