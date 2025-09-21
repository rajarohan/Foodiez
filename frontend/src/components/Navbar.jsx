import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, User, LogOut, Menu, Home, UtensilsCrossed, Package, Search } from 'lucide-react';
import { logout } from '../redux/authSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  
  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold fs-3" to="/">
          <UtensilsCrossed className="me-2" size={32} />
          Foodiez
        </Link>

        {/* Mobile menu button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <Menu size={24} />
        </button>

        {/* Navigation items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Left side navigation */}
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/')}`} to="/">
                <Home size={18} className="me-1" />
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/restaurants')}`} to="/restaurants">
                <UtensilsCrossed size={18} className="me-1" />
                Restaurants
              </Link>
            </li>
            {isAuthenticated && user?.role === 'customer' && (
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/orders')}`} to="/orders">
                  <Package size={18} className="me-1" />
                  My Orders
                </Link>
              </li>
            )}
          </ul>

          {/* Search bar (hidden on mobile for simplicity) */}
          <div className="d-none d-lg-flex me-3">
            <div className="input-group" style={{ width: '300px' }}>
              <span className="input-group-text bg-white">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search restaurants or dishes..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                  }
                }}
              />
            </div>
          </div>

          {/* Right side navigation */}
          <ul className="navbar-nav">
            {isAuthenticated ? (
              <>
                {/* Cart icon (only for customers) */}
                {user?.role === 'customer' && (
                  <li className="nav-item">
                    <Link className={`nav-link position-relative ${isActive('/cart')}`} to="/cart">
                      <ShoppingCart size={20} />
                      {cartItemsCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          {cartItemsCount > 99 ? '99+' : cartItemsCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )}

                {/* User dropdown */}
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle d-flex align-items-center"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <User size={20} className="me-1" />
                    <span className="d-none d-md-inline">
                      {user?.name || user?.firstName || 'User'}
                    </span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <User size={16} className="me-2" />
                        Profile
                      </Link>
                    </li>
                    {user?.role === 'admin' && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link className="dropdown-item" to="/admin/dashboard">
                            <Package size={16} className="me-2" />
                            Admin Dashboard
                          </Link>
                        </li>
                      </>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <LogOut size={16} className="me-2" />
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                {/* Login/Register buttons */}
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-outline-light btn-sm ms-2" to="/register">
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;