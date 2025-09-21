import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, Clock, Shield, AlertCircle } from 'lucide-react';
import { createOrder } from '../redux/orderSlice';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { isLoading } = useSelector((state) => state.orders);
  
  // Get cart data from navigation state or redirect to cart
  const { cartItems = [], pricing = {}, promoCode = null } = location.state || {};
  
  const [formData, setFormData] = useState({
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      instructions: ''
    },
    paymentMethod: 'card',
    cardDetails: {
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    },
    contactPhone: user?.phone || '',
    orderNotes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [useProfile, setUseProfile] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'customer') {
      navigate('/');
      toast.error('Only customers can place orders');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    // Pre-fill with user profile data
    if (user && useProfile) {
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || 'USA'
        },
        contactPhone: user.phone || ''
      }));
    }
  }, [isAuthenticated, user, cartItems, navigate, useProfile]);

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setFormData(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field] || (nested && errors[nested]?.[field])) {
      setErrors(prev => ({
        ...prev,
        [nested || field]: nested ? { ...prev[nested], [field]: '' } : ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Address validation
    if (!formData.deliveryAddress.street.trim()) {
      newErrors.deliveryAddress = { ...newErrors.deliveryAddress, street: 'Street address is required' };
    }
    if (!formData.deliveryAddress.city.trim()) {
      newErrors.deliveryAddress = { ...newErrors.deliveryAddress, city: 'City is required' };
    }
    if (!formData.deliveryAddress.state.trim()) {
      newErrors.deliveryAddress = { ...newErrors.deliveryAddress, state: 'State is required' };
    }
    if (!formData.deliveryAddress.zipCode.trim()) {
      newErrors.deliveryAddress = { ...newErrors.deliveryAddress, zipCode: 'ZIP code is required' };
    }
    
    // Phone validation
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    }
    
    // Payment validation
    if (formData.paymentMethod === 'card') {
      if (!formData.cardDetails.number.trim()) {
        newErrors.cardDetails = { ...newErrors.cardDetails, number: 'Card number is required' };
      }
      if (!formData.cardDetails.expiry.trim()) {
        newErrors.cardDetails = { ...newErrors.cardDetails, expiry: 'Expiry date is required' };
      }
      if (!formData.cardDetails.cvv.trim()) {
        newErrors.cardDetails = { ...newErrors.cardDetails, cvv: 'CVV is required' };
      }
      if (!formData.cardDetails.name.trim()) {
        newErrors.cardDetails = { ...newErrors.cardDetails, name: 'Cardholder name is required' };
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        items: cartItems.map(item => ({
          menuItem: item.menuItem._id,
          quantity: item.quantity,
          price: item.menuItem.price,
          customization: item.customization || {}
        })),
        restaurant: cartItems[0]?.menuItem?.restaurant || cartItems[0]?.restaurantId,
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        contactPhone: formData.contactPhone,
        orderNotes: formData.orderNotes,
        pricing: {
          subtotal: pricing.subtotal,
          tax: pricing.tax,
          deliveryFee: pricing.deliveryFee,
          discount: pricing.discount || 0,
          total: pricing.total
        },
        promoCode
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      
      toast.success('Order placed successfully!');
      navigate('/orders', { 
        state: { 
          newOrderId: result._id,
          orderConfirmation: true 
        } 
      });
      
    } catch (error) {
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  if (isLoading) {
    return <Loading size="lg" text="Processing your order..." fullScreen={true} />;
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container py-5">
        <ErrorMessage 
          error="No items found for checkout" 
          onRetry={() => navigate('/cart')}
        />
      </div>
    );
  }

  return (
    <div className="checkout-page bg-light min-vh-100">
      <div className="container py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-link text-primary p-0 me-3"
                onClick={() => navigate('/cart')}
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h2 className="mb-0">Checkout</h2>
                <p className="text-muted mb-0">Complete your order</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="row">
            {/* Main Form */}
            <div className="col-lg-8 mb-4">
              {/* Delivery Address */}
              <div className="card shadow-sm mb-4">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="fw-bold mb-0">
                      <MapPin className="me-2" size={18} />
                      Delivery Address
                    </h6>
                    {user?.address && (
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={useProfile}
                          onChange={(e) => setUseProfile(e.target.checked)}
                        />
                        <label className="form-check-label small">
                          Use profile address
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Street Address *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.deliveryAddress?.street ? 'is-invalid' : ''}`}
                        value={formData.deliveryAddress.street}
                        onChange={(e) => handleInputChange('street', e.target.value, 'deliveryAddress')}
                        placeholder="Enter your street address"
                      />
                      {errors.deliveryAddress?.street && (
                        <div className="invalid-feedback">{errors.deliveryAddress.street}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">City *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.deliveryAddress?.city ? 'is-invalid' : ''}`}
                        value={formData.deliveryAddress.city}
                        onChange={(e) => handleInputChange('city', e.target.value, 'deliveryAddress')}
                        placeholder="City"
                      />
                      {errors.deliveryAddress?.city && (
                        <div className="invalid-feedback">{errors.deliveryAddress.city}</div>
                      )}
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label className="form-label">State *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.deliveryAddress?.state ? 'is-invalid' : ''}`}
                        value={formData.deliveryAddress.state}
                        onChange={(e) => handleInputChange('state', e.target.value, 'deliveryAddress')}
                        placeholder="State"
                      />
                      {errors.deliveryAddress?.state && (
                        <div className="invalid-feedback">{errors.deliveryAddress.state}</div>
                      )}
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label className="form-label">ZIP Code *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.deliveryAddress?.zipCode ? 'is-invalid' : ''}`}
                        value={formData.deliveryAddress.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value, 'deliveryAddress')}
                        placeholder="ZIP"
                      />
                      {errors.deliveryAddress?.zipCode && (
                        <div className="invalid-feedback">{errors.deliveryAddress.zipCode}</div>
                      )}
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label className="form-label">Delivery Instructions</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.deliveryAddress.instructions}
                        onChange={(e) => handleInputChange('instructions', e.target.value, 'deliveryAddress')}
                        placeholder="Any special delivery instructions..."
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Contact Phone *</label>
                      <input
                        type="tel"
                        className={`form-control ${errors.contactPhone ? 'is-invalid' : ''}`}
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        placeholder="Phone number for delivery"
                      />
                      {errors.contactPhone && (
                        <div className="invalid-feedback">{errors.contactPhone}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card shadow-sm mb-4">
                <div className="card-header">
                  <h6 className="fw-bold mb-0">
                    <CreditCard className="me-2" size={18} />
                    Payment Method
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={formData.paymentMethod === 'card'}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        />
                        <label className="form-check-label">
                          Credit/Debit Card
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={formData.paymentMethod === 'cash'}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        />
                        <label className="form-check-label">
                          Cash on Delivery
                        </label>
                      </div>
                    </div>
                  </div>

                  {formData.paymentMethod === 'card' && (
                    <div className="row">
                      <div className="col-12 mb-3">
                        <label className="form-label">Cardholder Name *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.cardDetails?.name ? 'is-invalid' : ''}`}
                          value={formData.cardDetails.name}
                          onChange={(e) => handleInputChange('name', e.target.value, 'cardDetails')}
                          placeholder="Full name on card"
                        />
                        {errors.cardDetails?.name && (
                          <div className="invalid-feedback">{errors.cardDetails.name}</div>
                        )}
                      </div>
                      
                      <div className="col-12 mb-3">
                        <label className="form-label">Card Number *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.cardDetails?.number ? 'is-invalid' : ''}`}
                          value={formatCardNumber(formData.cardDetails.number)}
                          onChange={(e) => handleInputChange('number', e.target.value.replace(/\s/g, ''), 'cardDetails')}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                        />
                        {errors.cardDetails?.number && (
                          <div className="invalid-feedback">{errors.cardDetails.number}</div>
                        )}
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Expiry Date *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.cardDetails?.expiry ? 'is-invalid' : ''}`}
                          value={formData.cardDetails.expiry}
                          onChange={(e) => handleInputChange('expiry', e.target.value, 'cardDetails')}
                          placeholder="MM/YY"
                          maxLength="5"
                        />
                        {errors.cardDetails?.expiry && (
                          <div className="invalid-feedback">{errors.cardDetails.expiry}</div>
                        )}
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">CVV *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.cardDetails?.cvv ? 'is-invalid' : ''}`}
                          value={formData.cardDetails.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value, 'cardDetails')}
                          placeholder="123"
                          maxLength="4"
                        />
                        {errors.cardDetails?.cvv && (
                          <div className="invalid-feedback">{errors.cardDetails.cvv}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === 'cash' && (
                    <div className="alert alert-info">
                      <AlertCircle size={16} className="me-2" />
                      You will pay cash when your order is delivered. Please have exact change ready.
                    </div>
                  )}
                </div>
              </div>

              {/* Order Notes */}
              <div className="card shadow-sm">
                <div className="card-header">
                  <h6 className="fw-bold mb-0">Order Notes</h6>
                </div>
                <div className="card-body">
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.orderNotes}
                    onChange={(e) => handleInputChange('orderNotes', e.target.value)}
                    placeholder="Any special instructions for your order..."
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-lg-4">
              <div className="card shadow-sm sticky-top" style={{ top: '100px' }}>
                <div className="card-header">
                  <h6 className="fw-bold mb-0">Order Summary</h6>
                </div>
                <div className="card-body">
                  {/* Items */}
                  <div className="mb-3">
                    {cartItems.map((item) => (
                      <div key={item._id} className="d-flex justify-content-between mb-2">
                        <div className="flex-grow-1">
                          <small className="fw-bold">{item.menuItem?.name}</small>
                          <small className="text-muted d-block">Qty: {item.quantity}</small>
                        </div>
                        <small className="text-nowrap ms-2">
                          ${(item.menuItem?.price * item.quantity).toFixed(2)}
                        </small>
                      </div>
                    ))}
                  </div>

                  <hr />

                  {/* Pricing */}
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span>${pricing.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Delivery Fee</span>
                    <span>${pricing.deliveryFee?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tax</span>
                    <span>${pricing.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  {pricing.discount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Discount {promoCode && `(${promoCode})`}</span>
                      <span>-${pricing.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between fw-bold mb-3">
                    <span>Total</span>
                    <span className="text-primary">${pricing.total?.toFixed(2) || '0.00'}</span>
                  </div>

                  {/* Delivery Info */}
                  <div className="text-center text-muted mb-3">
                    <Clock size={16} className="me-1" />
                    <small>Estimated delivery: 30-45 minutes</small>
                  </div>

                  {/* Place Order Button */}
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Shield className="me-2" size={18} />
                        Place Order
                      </>
                    )}
                  </button>
                  
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      <Shield size={12} className="me-1" />
                      Your payment information is secure
                    </small>
                  </div>
                  
                  <Link to="/cart" className="btn btn-link w-100 mt-2">
                    Back to Cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;