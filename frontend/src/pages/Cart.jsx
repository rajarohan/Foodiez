import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.cart.get();
      setCart(response.data.cart);
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 404) {
        setCart({ items: [], totalPrice: 0, restaurant: null });
      } else {
        setError('Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity === 0) {
      await removeItem(itemId);
      return;
    }

    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await api.cart.update(itemId, { quantity: newQuantity });
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const removeItem = async (itemId) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await api.cart.removeItem(itemId);
      await fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    
    try {
      await api.cart.clear();
      setCart({ items: [], totalPrice: 0, restaurant: null });
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      await api.cart.applyCoupon(couponCode.trim());
      await fetchCart();
      setAppliedCoupon(couponCode.trim());
      setCouponCode('');
    } catch (error) {
      console.error('Error applying coupon:', error);
      setError('Invalid coupon code');
    }
  };

  const removeCoupon = async () => {
    try {
      await api.cart.removeCoupon();
      await fetchCart();
      setAppliedCoupon(null);
    } catch (error) {
      console.error('Error removing coupon:', error);
      setError('Failed to remove coupon');
    }
  };

  const proceedToCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Start adding some delicious items to your cart!</p>
            <Link
              to="/restaurants"
              className="mt-6 inline-block btn-primary"
            >
              Browse Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">Review your order before checkout</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Restaurant Header */}
              {cart.restaurant && (
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {cart.restaurant.name}
                      </h2>
                      <p className="text-sm text-gray-600">{cart.restaurant.address}</p>
                    </div>
                    <Link
                      to={`/restaurant/${cart.restaurant._id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Add more items
                    </Link>
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <div key={item._id} className="p-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.menuItem.image || '/api/placeholder/100/100'}
                        alt={item.menuItem.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.menuItem.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.menuItem.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.menuItem.isVegetarian && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Vegetarian
                            </span>
                          )}
                          {item.menuItem.isSpicy && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                              Spicy
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}
                          disabled={updating[item.menuItem._id]}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="font-medium min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}
                          disabled={updating[item.menuItem._id]}
                          className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-50"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.menuItem._id)}
                        disabled={updating[item.menuItem._id]}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Actions */}
              <div className="border-t border-gray-200 p-6">
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Coupon Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
                    <span className="text-sm text-green-800">
                      Code: {appliedCoupon}
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={!couponCode.trim()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>${cart.subtotal?.toFixed(2) || cart.totalPrice.toFixed(2)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${cart.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>${cart.deliveryFee?.toFixed(2) || '2.99'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${cart.tax?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${cart.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={proceedToCheckout}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <CreditCardIcon className="h-5 w-5" />
                <span>Proceed to Checkout</span>
              </button>

              {/* Delivery Info */}
              <div className="mt-4 text-sm text-gray-600">
                <p>📍 Delivering to: {user?.addresses?.[0] || 'Default Address'}</p>
                <p className="mt-1">⏱️ Estimated delivery: 30-45 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;