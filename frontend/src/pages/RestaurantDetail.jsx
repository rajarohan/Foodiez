import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Star, Clock, MapPin, Phone, Plus, Minus, ShoppingCart, Search, Filter } from 'lucide-react';
import { getRestaurant, getRestaurantMenu } from '../redux/restaurantSlice';
import { addToCart } from '../redux/cartSlice';
import Loading from '../components/Loading';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';
import toast from 'react-hot-toast';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentRestaurant, menuItems, isLoading, error } = useSelector((state) => state.restaurants);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(getRestaurant(id));
      dispatch(getRestaurantMenu({ restaurantId: id }));
    }
  }, [dispatch, id]);

  const categories = [...new Set(menuItems.map(item => item.category))];
  
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  const handleAddToCart = async (menuItem, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (user?.role !== 'customer') {
      toast.error('Only customers can add items to cart');
      return;
    }

    try {
      await dispatch(addToCart({
        menuItemId: menuItem._id,
        quantity,
        customization: {}
      })).unwrap();
      
      toast.success(`${menuItem.name} added to cart`);
      
      // Update local cart counter
      setCartItems(prev => ({
        ...prev,
        [menuItem._id]: (prev[menuItem._id] || 0) + quantity
      }));
    } catch (error) {
      toast.error(error.message || 'Failed to add item to cart');
    }
  };

  const updateQuantity = (menuItemId, newQuantity) => {
    if (newQuantity <= 0) {
      const { [menuItemId]: _removed, ...rest } = cartItems;
      setCartItems(rest);
    } else {
      setCartItems(prev => ({
        ...prev,
        [menuItemId]: newQuantity
      }));
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} fill="currentColor" className="text-warning" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} fill="currentColor" className="text-warning" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-muted" />);
    }
    
    return stars;
  };

  if (isLoading) {
    return <Loading size="lg" text="Loading restaurant details..." fullScreen={true} />;
  }

  if (error) {
    return (
      <div className="container py-5">
        <ErrorMessage 
          error={error} 
          onRetry={() => {
            dispatch(getRestaurant(id));
            dispatch(getRestaurantMenu({ restaurantId: id }));
          }} 
        />
      </div>
    );
  }

  if (!currentRestaurant) {
    return (
      <div className="container py-5">
        <EmptyState
          title="Restaurant not found"
          message="The restaurant you're looking for doesn't exist or has been removed."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/restaurants')}>
              Browse Restaurants
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="restaurant-detail-page">
      {/* Restaurant Header */}
      <div className="position-relative">
        <div 
          className="restaurant-hero bg-primary text-white py-5"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${currentRestaurant.image || '/api/placeholder/1200/400'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h1 className="display-5 fw-bold mb-2">{currentRestaurant.name}</h1>
                
                <div className="d-flex align-items-center mb-3">
                  <div className="d-flex align-items-center me-4">
                    {getRatingStars(currentRestaurant.rating || 4.5)}
                    <span className="ms-2">
                      {currentRestaurant.rating || '4.5'} ({currentRestaurant.reviewCount || '100+'} reviews)
                    </span>
                  </div>
                  <span className="badge bg-success px-3 py-2">
                    {currentRestaurant.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                <p className="lead mb-3">{currentRestaurant.description}</p>
                
                <div className="row text-white-50">
                  <div className="col-md-4 mb-2">
                    <Clock size={18} className="me-2" />
                    <span>{currentRestaurant.deliveryTime || '30-45'} min delivery</span>
                  </div>
                  <div className="col-md-4 mb-2">
                    <MapPin size={18} className="me-2" />
                    <span>{currentRestaurant.address?.city}</span>
                  </div>
                  <div className="col-md-4 mb-2">
                    <Phone size={18} className="me-2" />
                    <span>{currentRestaurant.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-4 text-center">
                <div className="bg-white text-dark rounded p-4 shadow">
                  <h4 className="text-success mb-0">
                    ${currentRestaurant.deliveryFee || '2.99'}
                  </h4>
                  <p className="text-muted mb-0">Delivery Fee</p>
                  <hr />
                  <p className="mb-0">
                    <strong>Min Order: ${currentRestaurant.minimumOrder || '15.00'}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="container py-4">
        <div className="row">
          {/* Sidebar - Categories */}
          <div className="col-lg-3 mb-4">
            <div className="sticky-top" style={{ top: '100px' }}>
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0 fw-bold">Menu Categories</h6>
                </div>
                <div className="list-group list-group-flush">
                  <button
                    className={`list-group-item list-group-item-action ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('')}
                  >
                    All Items
                    <span className="badge bg-secondary float-end">{menuItems.length}</span>
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      className={`list-group-item list-group-item-action ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                      <span className="badge bg-secondary float-end">
                        {menuItems.filter(item => item.category === category).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Menu Items */}
          <div className="col-lg-9">
            {/* Search and Filters */}
            <div className="row mb-4">
              <div className="col-lg-8">
                <div className="input-group">
                  <span className="input-group-text">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-4 text-end">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={18} className="me-1" />
                  Filters
                </button>
              </div>
            </div>

            {/* Menu Items */}
            {filteredMenuItems.length === 0 ? (
              <EmptyState
                title="No menu items found"
                message="Try adjusting your search or category filter."
                action={
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setSelectedCategory('');
                      setSearchQuery('');
                    }}
                  >
                    Clear Filters
                  </button>
                }
              />
            ) : (
              <div className="row">
                {filteredMenuItems.map((item) => (
                  <div key={item._id} className="col-lg-6 mb-4">
                    <div className="card h-100 shadow-sm hover-shadow">
                      <div className="row g-0">
                        <div className="col-4">
                          <img
                            src={item.image || '/api/placeholder/150/150'}
                            className="img-fluid rounded-start h-100"
                            alt={item.name}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div className="col-8">
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title mb-0 fw-bold">{item.name}</h6>
                              <span className="text-success fw-bold">${item.price}</span>
                            </div>
                            
                            <p className="card-text text-muted small mb-2" style={{ fontSize: '0.85rem' }}>
                              {item.description}
                            </p>
                            
                            {item.ingredients && (
                              <p className="text-muted small mb-2">
                                <em>Ingredients: {item.ingredients.join(', ')}</em>
                              </p>
                            )}

                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                {getRatingStars(item.rating || 4.0)}
                                <span className="ms-1 text-muted small">({item.rating || '4.0'})</span>
                              </div>
                              
                              <div className="d-flex align-items-center">
                                {cartItems[item._id] ? (
                                  <div className="d-flex align-items-center">
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => updateQuantity(item._id, cartItems[item._id] - 1)}
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <span className="mx-2 fw-bold">{cartItems[item._id]}</span>
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => updateQuantity(item._id, cartItems[item._id] + 1)}
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleAddToCart(item)}
                                  >
                                    <Plus size={14} className="me-1" />
                                    Add
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Cart Button */}
      {Object.keys(cartItems).length > 0 && isAuthenticated && user?.role === 'customer' && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x mb-3" style={{ zIndex: 1000 }}>
          <button 
            className="btn btn-success btn-lg px-4"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={20} className="me-2" />
            View Cart ({Object.values(cartItems).reduce((sum, qty) => sum + qty, 0)} items)
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;