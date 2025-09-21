import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft, CreditCard } from 'lucide-react';
import { getCart, updateCartItem, removeFromCart, clearCart } from '../redux/cartSlice';
import Loading from '../components/Loading';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { items, subtotal, tax, deliveryFee, isLoading, error } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'customer') {
      navigate('/');
      toast.error('Only customers can access cart');
      return;
    }

    dispatch(getCart());
  }, [dispatch, isAuthenticated, user, navigate]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      await dispatch(updateCartItem({ 
        itemId, 
        quantity: newQuantity 
      })).unwrap();
      
      toast.success('Cart updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update cart');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeFromCart(itemId)).unwrap();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error(error.message || 'Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    try {
      await dispatch(clearCart()).unwrap();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error(error.message || 'Failed to clear cart');
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    
    // Simulate promo code validation
    setTimeout(() => {
      const validCodes = {
        'SAVE10': 10,
        'WELCOME15': 15,
        'FIRSTORDER': 20
      };
      
      if (validCodes[promoCode.toUpperCase()]) {
        const discountAmount = (subtotal * validCodes[promoCode.toUpperCase()]) / 100;
        setDiscount(discountAmount);
        toast.success(`Promo code applied! You saved $${discountAmount.toFixed(2)}`);
      } else {
        toast.error('Invalid promo code');
      }
      
      setIsApplyingPromo(false);
    }, 1000);
  };

  const finalTotal = Math.max(0, (subtotal || 0) + (tax || 0) + (deliveryFee || 0) - discount);

  const proceedToCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (finalTotal < 10) {
      toast.error('Minimum order amount is $10.00');
      return;
    }

    navigate('/checkout', {
      state: {
        cartItems: items,
        pricing: {
          subtotal: subtotal || 0,
          tax: tax || 0,
          deliveryFee: deliveryFee || 0,
          discount,
          total: finalTotal
        },
        promoCode: discount > 0 ? promoCode : null
      }
    });
  };

  if (isLoading) {
    return <Loading size="lg" text="Loading your cart..." fullScreen={true} />;
  }

  if (error) {
    return (
      <div className="container py-5">
        <ErrorMessage 
          error={error} 
          onRetry={() => dispatch(getCart())} 
        />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="container py-5">
        <EmptyState
          title="Your cart is empty"
          message="Looks like you haven't added anything to your cart yet."
          action={
            <Link to="/restaurants" className="btn btn-primary">
              <ShoppingCart className="me-2" size={18} />
              Start Shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="cart-page bg-light min-vh-100">
      <div className="container py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <button 
                  className="btn btn-link text-primary p-0 me-3"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h2 className="mb-0">Your Cart</h2>
                  <p className="text-muted mb-0">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              {items.length > 0 && (
                <button 
                  className="btn btn-outline-danger"
                  onClick={handleClearCart}
                >
                  <Trash2 size={16} className="me-1" />
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          {/* Cart Items */}
          <div className="col-lg-8 mb-4">
            <div className="card shadow-sm">
              <div className="card-body p-0">
                {items.map((item, index) => (
                  <div key={item._id} className={`p-4 ${index < items.length - 1 ? 'border-bottom' : ''}`}>
                    <div className="row align-items-center">
                      <div className="col-3 col-md-2">
                        <img
                          src={item.menuItem?.image || '/api/placeholder/80/80'}
                          alt={item.menuItem?.name}
                          className="img-fluid rounded"
                          style={{ aspectRatio: '1:1', objectFit: 'cover' }}
                        />
                      </div>
                      
                      <div className="col-6 col-md-7">
                        <h6 className="fw-bold mb-1">{item.menuItem?.name}</h6>
                        <p className="text-muted small mb-2">{item.menuItem?.description}</p>
                        <p className="text-success fw-bold mb-0">${item.menuItem?.price}</p>
                        
                        {item.customization && Object.keys(item.customization).length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted">
                              Customizations: {Object.entries(item.customization).map(([key, value]) => `${key}: ${value}`).join(', ')}
                            </small>
                          </div>
                        )}
                      </div>
                      
                      <div className="col-3 col-md-3 text-end">
                        <div className="d-flex align-items-center justify-content-end mb-2">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="mx-2 fw-bold">{item.quantity}</span>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <button
                          className="btn btn-link text-danger p-0"
                          onClick={() => handleRemoveItem(item._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="card shadow-sm mt-3">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Promo Code</h6>
                <div className="row">
                  <div className="col-8">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={discount > 0}
                    />
                  </div>
                  <div className="col-4">
                    <button
                      className="btn btn-outline-primary w-100"
                      onClick={handleApplyPromo}
                      disabled={isApplyingPromo || discount > 0}
                    >
                      {isApplyingPromo ? 'Applying...' : discount > 0 ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>
                
                {discount > 0 && (
                  <div className="alert alert-success mt-3 mb-0">
                    <strong>Great!</strong> You saved ${discount.toFixed(2)} with code "{promoCode}"
                    <button 
                      className="btn btn-link text-success p-0 ms-2"
                      onClick={() => {
                        setDiscount(0);
                        setPromoCode('');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                
                <div className="mt-2">
                  <small className="text-muted">
                    Try: SAVE10, WELCOME15, or FIRSTORDER
                  </small>
                </div>
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
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>${(subtotal || 0).toFixed(2)}</span>
                </div>
                
                <div className="d-flex justify-content-between mb-2">
                  <span>Delivery Fee</span>
                  <span>${(deliveryFee || 2.99).toFixed(2)}</span>
                </div>
                
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax</span>
                  <span>${(tax || 0).toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Promo Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                
                <hr />
                
                <div className="d-flex justify-content-between fw-bold mb-3">
                  <span>Total</span>
                  <span className="text-primary">${finalTotal.toFixed(2)}</span>
                </div>

                {finalTotal < 10 && (
                  <div className="alert alert-warning small p-2 mb-3">
                    Minimum order amount is $10.00. Add ${(10 - finalTotal).toFixed(2)} more to checkout.
                  </div>
                )}

                <button
                  className="btn btn-primary w-100 py-3"
                  onClick={proceedToCheckout}
                  disabled={items.length === 0 || finalTotal < 10}
                >
                  <CreditCard className="me-2" size={18} />
                  Proceed to Checkout
                </button>
                
                <Link 
                  to="/restaurants" 
                  className="btn btn-link w-100 mt-2"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="card shadow-sm mt-3">
              <div className="card-body">
                <h6 className="fw-bold mb-2">Delivery Info</h6>
                <p className="text-muted small mb-2">
                  Estimated delivery: 30-45 minutes
                </p>
                <p className="text-muted small mb-0">
                  Free delivery on orders over $25
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;