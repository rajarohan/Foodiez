import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, UtensilsCrossed } from 'lucide-react';
import { registerUser } from '../redux/authSlice';
import { ButtonLoading } from '../components/Loading';
import ErrorMessage, { ValidationError } from '../components/ErrorMessage';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isLoading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState('customer'); // 'customer' or 'admin'
  const [validationErrors, setValidationErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const errors = [];

    // Basic validation
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Email format is invalid');
    }

    if (!formData.password) {
      errors.push('Password is required');
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    if (!formData.phone.trim()) {
      errors.push('Phone number is required');
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.push('Phone number format is invalid');
    }

    // Address validation for customers
    if (userType === 'customer') {
      if (!formData.address.street.trim()) {
        errors.push('Street address is required');
      }
      if (!formData.address.city.trim()) {
        errors.push('City is required');
      }
      if (!formData.address.state.trim()) {
        errors.push('State is required');
      }
      if (!formData.address.zipCode.trim()) {
        errors.push('Zip code is required');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: userType
      };

      // Add address for customers
      if (userType === 'customer') {
        userData.address = formData.address;
      }

      await dispatch(registerUser(userData)).unwrap();
      
      // Redirect based on user type
      if (userType === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/restaurants');
      }
    } catch (error) {
      // Error is handled by Redux state
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="register-page min-vh-100 d-flex align-items-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow">
              <div className="card-body p-4">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center text-primary mb-3">
                    <UtensilsCrossed size={48} />
                  </div>
                  <h1 className="h3 fw-bold">Create Account</h1>
                  <p className="text-muted">Join Foodiez and start ordering!</p>
                </div>

                {/* User Type Toggle */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Account Type</label>
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
                      Customer Account
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
                      Restaurant Admin
                    </label>
                  </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <ValidationError 
                    errors={validationErrors} 
                    onDismiss={() => setValidationErrors([])}
                  />
                )}

                {/* Server Error */}
                {error && (
                  <ErrorMessage 
                    error={error} 
                    className="mb-3"
                  />
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit}>
                  {/* Basic Information */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">
                        Full Name *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <User size={18} />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">
                        Phone Number *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Phone size={18} />
                        </span>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address *
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
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label">
                        Password *
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
                      <div className="form-text">
                        Minimum 6 characters required
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm Password *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Lock size={18} />
                        </span>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="form-control"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Address Fields (only for customers) */}
                  {userType === 'customer' && (
                    <>
                      <div className="mb-3">
                        <h6 className="fw-semibold text-primary">
                          <MapPin size={18} className="me-1" />
                          Delivery Address
                        </h6>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="address.street" className="form-label">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="address.street"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleChange}
                          placeholder="Enter your street address"
                          required
                        />
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="address.city" className="form-label">
                            City *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="address.city"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleChange}
                            placeholder="Enter your city"
                            required
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="address.state" className="form-label">
                            State *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="address.state"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleChange}
                            placeholder="Enter your state"
                            required
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="address.zipCode" className="form-label">
                            Zip Code *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="address.zipCode"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleChange}
                            placeholder="Enter your zip code"
                            required
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="address.country" className="form-label">
                            Country
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="address.country"
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleChange}
                            placeholder="Enter your country"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="d-grid mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ButtonLoading text="Creating Account..." />
                      ) : (
                        `Create ${userType === 'admin' ? 'Admin' : 'Customer'} Account`
                      )}
                    </button>
                  </div>
                </form>

                {/* Links */}
                <div className="text-center">
                  <p className="text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none fw-semibold">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;