import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPinIcon,
  CreditCardIcon,
  TruckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const [orderForm, setOrderForm] = useState({
    paymentMethod: 'card',
    specialInstructions: '',
    contactInfo: {
      phone: user?.phone || '',
      email: user?.email || ''
    }
  });

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCardIcon },
    { id: 'cash', name: 'Cash on Delivery', icon: TruckIcon },
    { id: 'upi', name: 'UPI Payment', icon: CreditCardIcon },
    { id: 'wallet', name: 'Digital Wallet', icon: CreditCardIcon }
  ];

  const fetchCart = React.useCallback(async () => {
    try {
      const response = await api.cart.getCart();
      setCart(response.data.cart);
      
      if (!response.data.cart || response.data.cart.items.length === 0) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart items');
    }
  }, [navigate]);

  useEffect(() => {
    fetchCart();
    
    if (user?.addresses?.length > 0) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [user, fetchCart]);

  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, tax: 0, deliveryFee: 0, total: 0 };
    
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    const tax = subtotal * 0.08; // 8% tax
    const deliveryFee = subtotal > 50 ? 0 : 5; // Free delivery over $50
    const total = subtotal + tax + deliveryFee;
    
    return { subtotal, tax, deliveryFee, total };
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.auth.addAddress(newAddress);
      const updatedUser = response.data.user;
      const newAddr = updatedUser.addresses[updatedUser.addresses.length - 1];
      setSelectedAddress(newAddr);
      setShowAddressModal(false);
      setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '' });
    } catch (error) {
      console.error('Error adding address:', error);
      setError(error.response?.data?.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    if (!orderForm.contactInfo.phone) {
      setError('Please provide a contact phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        deliveryAddress: selectedAddress,
        paymentMethod: orderForm.paymentMethod,
        specialInstructions: orderForm.specialInstructions,
        contactInfo: orderForm.contactInfo
      };

      await api.orders.createOrder(orderData);
      setSuccess('Order placed successfully!');
      
      // Redirect to order confirmation/tracking page
      setTimeout(() => {
        navigate(`/orders`);
      }, 2000);

    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (!cart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>

        {/* Messages */}
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
        
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Delivery Address
                </h2>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Add New Address
                </button>
              </div>

              {user?.addresses?.length === 0 ? (
                <div className="text-center py-8">
                  <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No addresses found</h3>
                  <p className="mt-2 text-gray-600">Please add a delivery address to continue.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user?.addresses?.map((address, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAddress === address
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{address.label}</h3>
                        {address.isDefault && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{address.street}</p>
                        <p>{address.city}, {address.state} {address.zipCode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Payment Method
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        orderForm.paymentMethod === method.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setOrderForm({ ...orderForm, paymentMethod: method.id })}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{method.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={orderForm.contactInfo.phone}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      contactInfo: { ...orderForm.contactInfo, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={orderForm.contactInfo.email}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      contactInfo: { ...orderForm.contactInfo, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={orderForm.specialInstructions}
                  onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
                  placeholder="Any special requests or instructions for the restaurant or delivery..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-3 mb-4 border-b border-gray-200 pb-4">
                {cart.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.menuItem.name}</h4>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">
                    {totals.deliveryFee === 0 ? 'FREE' : `$${totals.deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-base font-semibold text-gray-900">${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Estimated Delivery Time */}
              <div className="flex items-center text-sm text-gray-600 mb-6">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>Estimated delivery: 30-45 minutes</span>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading || !selectedAddress || !orderForm.contactInfo.phone}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing Order...' : `Place Order - $${totals.total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>

        {/* Add Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Address</h3>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Label
                    </label>
                    <input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      placeholder="Home, Work, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressModal(false);
                        setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '' });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Address'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;