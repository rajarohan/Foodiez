import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './redux/store';
import { useDispatch } from 'react-redux';
import { loadUser } from './redux/authSlice';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute, { AdminRoute, CustomerRoute, GuestRoute } from './components/ProtectedRoute';

// Page Components (to be created)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Search from './pages/Search';
import NotFound from './pages/NotFound';

// Admin Pages (to be created)
import AdminDashboard from './pages/admin/Dashboard';
import AdminRestaurants from './pages/admin/Restaurants';
import AdminMenu from './pages/admin/Menu';
import AdminOrders from './pages/admin/Orders';
import AdminProfile from './pages/admin/Profile';

// App Layout Component
const AppLayout = ({ children }) => (
  <>
    <Navbar />
    <main className="min-vh-100">
      {children}
    </main>
    <Footer />
  </>
);

// Auth checker component
const AuthChecker = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return null;
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <AuthChecker />
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
              error: {
                duration: 5000,
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <AppLayout>
                <Home />
              </AppLayout>
            } />
            
            <Route path="/restaurants" element={
              <AppLayout>
                <Restaurants />
              </AppLayout>
            } />
            
            <Route path="/restaurants/:id" element={
              <AppLayout>
                <RestaurantDetail />
              </AppLayout>
            } />
            
            <Route path="/search" element={
              <AppLayout>
                <Search />
              </AppLayout>
            } />

            {/* Guest Only Routes (Login/Register) */}
            <Route path="/login" element={
              <GuestRoute>
                <AppLayout>
                  <Login />
                </AppLayout>
              </GuestRoute>
            } />
            
            <Route path="/register" element={
              <GuestRoute>
                <AppLayout>
                  <Register />
                </AppLayout>
              </GuestRoute>
            } />

            {/* Protected Routes (Any authenticated user) */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            } />

            {/* Customer Only Routes */}
            <Route path="/cart" element={
              <CustomerRoute>
                <AppLayout>
                  <Cart />
                </AppLayout>
              </CustomerRoute>
            } />
            
            <Route path="/checkout" element={
              <CustomerRoute>
                <AppLayout>
                  <Checkout />
                </AppLayout>
              </CustomerRoute>
            } />
            
            <Route path="/orders" element={
              <CustomerRoute>
                <AppLayout>
                  <Orders />
                </AppLayout>
              </CustomerRoute>
            } />
            
            <Route path="/orders/:id" element={
              <CustomerRoute>
                <AppLayout>
                  <OrderDetail />
                </AppLayout>
              </CustomerRoute>
            } />

            {/* Admin Only Routes */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </AdminRoute>
            } />
            
            <Route path="/admin/restaurants" element={
              <AdminRoute>
                <AppLayout>
                  <AdminRestaurants />
                </AppLayout>
              </AdminRoute>
            } />
            
            <Route path="/admin/menu" element={
              <AdminRoute>
                <AppLayout>
                  <AdminMenu />
                </AppLayout>
              </AdminRoute>
            } />
            
            <Route path="/admin/orders" element={
              <AdminRoute>
                <AppLayout>
                  <AdminOrders />
                </AppLayout>
              </AdminRoute>
            } />
            
            <Route path="/admin/profile" element={
              <AdminRoute>
                <AppLayout>
                  <AdminProfile />
                </AppLayout>
              </AdminRoute>
            } />

            {/* 404 Page */}
            <Route path="*" element={
              <AppLayout>
                <NotFound />
              </AppLayout>
            } />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
