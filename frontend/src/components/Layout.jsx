import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon,
  ShoppingCartIcon,
  UserIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Restaurants', href: '/restaurants', icon: BuildingStorefrontIcon },
    ...(isAuthenticated && user?.role === 'admin' ? [
      { name: 'Admin Dashboard', href: '/admin', icon: CogIcon },
    ] : []),
    ...(isAuthenticated ? [
      { name: 'My Orders', href: '/orders', icon: ClipboardDocumentListIcon },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Foodiez</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Cart Icon (only for authenticated customers) */}
              {isAuthenticated && user?.role === 'customer' && (
                <Link
                  to="/cart"
                  className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                </Link>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span className="hidden sm:block text-sm font-medium">
                      {user.name}
                    </span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <UserIcon className="h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-primary-600"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 text-base font-medium rounded-md ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Foodiez</span>
              </div>
              <p className="text-gray-600 text-sm">
                Your favorite food ordering platform. Fast, reliable, and delicious.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/restaurants" className="hover:text-primary-600">Restaurants</Link></li>
                <li><Link to="/about" className="hover:text-primary-600">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-primary-600">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/help" className="hover:text-primary-600">Help Center</Link></li>
                <li><Link to="/privacy" className="hover:text-primary-600">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary-600">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Connect</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Email: support@foodiez.com</li>
                <li>Phone: (555) 123-4567</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-6">
            <p className="text-center text-sm text-gray-600">
              © 2024 Foodiez. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;