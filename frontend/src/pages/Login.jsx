import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, UtensilsCrossed } from 'lucide-react';
import { login } from '../redux/authSlice';
import { ButtonLoading } from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { isLoading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('customer'); // 'customer' or 'admin'

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(login({ 
        email: formData.email,
        password: formData.password,
        role: userType 
      })).unwrap();
      
      // Redirect based on user type or to intended page
      if (userType === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      // Error is handled by Redux state
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow">
              <div className="card-body p-4">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center text-primary mb-3">
                    <UtensilsCrossed size={48} />
                  </div>
                  <h1 className="h3 fw-bold">Welcome Back</h1>
                  <p className="text-muted">Sign in to your Foodiez account</p>
                </div>

                {/* User Type Toggle */}
                <div className="mb-4">
                  <div className="btn-group w-100" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="userType"
                      id="customer"
                      value="customer"
                      checked={userType === 'customer'}
                      onChange={(e) => setUserType(e.target.value)}
                    />
                    <label className="btn btn-outline-primary" htmlFor="customer">
                      Customer
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="userType"
                      id="admin"
                      value="admin"
                      checked={userType === 'admin'}
                      onChange={(e) => setUserType(e.target.value)}
                    />
                    <label className="btn btn-outline-primary" htmlFor="admin">
                      Admin
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <ErrorMessage 
                    error={error} 
                    onDismiss={() => {/* Clear error if needed */}} 
                    className="mb-3"
                  />
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Mail size={18} />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Lock size={18} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="d-grid mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ButtonLoading text="Signing in..." />
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>

                {/* Links */}
                <div className="text-center">
                  <p className="mb-2">
                    <Link to="/forgot-password" className="text-decoration-none">
                      Forgot your password?
                    </Link>
                  </p>
                  <p className="text-muted">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-decoration-none fw-semibold">
                      Sign up here
                    </Link>
                  </p>
                </div>

                {/* Demo Credentials */}
                {import.meta.env.DEV && (
                  <div className="mt-4 p-3 bg-light rounded">
                    <small className="text-muted">
                      <strong>Demo Credentials:</strong><br />
                      Customer: customer@demo.com / password123<br />
                      Admin: admin@demo.com / password123
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;