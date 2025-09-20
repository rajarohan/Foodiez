import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminMenuItems from './pages/admin/AdminMenuItems';
import AdminOrders from './pages/admin/AdminOrders';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public routes without layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Routes with layout */}
            <Route path="/*" element={
              <Layout>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/restaurants" element={<Restaurants />} />
                  <Route path="/restaurant/:id" element={<RestaurantDetail />} />

                  {/* Protected customer routes */}
                  <Route path="/cart" element={
                    <ProtectedRoute requiredRole="customer">
                      <Cart />
                    </ProtectedRoute>
                  } />
                  <Route path="/checkout" element={
                    <ProtectedRoute requiredRole="customer">
                      <Checkout />
                    </ProtectedRoute>
                  } />
                  <Route path="/orders" element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Protected admin routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/restaurants" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminRestaurants />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/menu-items" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminMenuItems />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/orders" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminOrders />
                    </ProtectedRoute>
                  } />

                  {/* Catch all route */}
                  <Route path="*" element={
                    <div className="min-h-96 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                        <p className="text-gray-600 mb-6">Page not found</p>
                        <a href="/" className="btn-primary">Go Home</a>
                      </div>
                    </div>
                  } />
                </Routes>
              </Layout>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
