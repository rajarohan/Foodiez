import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Phone, Mail, Lock, Save, Edit2, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { updateProfile, updatePassword, deleteAccount } from '../redux/authSlice';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ValidationError from '../components/ValidationError';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Populate form with user data
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || 'USA'
        }
      });
    }
  }, [isAuthenticated, user, navigate]);

  const handleProfileInputChange = (field, value, nested = null) => {
    if (nested) {
      setProfileForm(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
    } else {
      setProfileForm(prev => ({
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

  const handlePasswordInputChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!profileForm.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(updateProfile(profileForm)).unwrap();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })).unwrap();
      
      toast.success('Password updated successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const confirmation = window.prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(deleteAccount()).unwrap();
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (isLoading) {
    return <Loading size="lg" text="Loading profile..." fullScreen={true} />;
  }

  if (!user) {
    return (
      <div className="container py-5">
        <ErrorMessage 
          error="Unable to load profile data" 
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="profile-page bg-light min-vh-100">
      <div className="container py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <div className="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                     style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '24px' }}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div>
                <h2 className="mb-0">{user.name}</h2>
                <p className="text-muted mb-0">{user.email}</p>
                <small className="text-muted">
                  {user.role === 'customer' ? 'Customer Account' : 'Admin Account'}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="row">
          <div className="col-lg-3 mb-4">
            <div className="card">
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="me-2" size={18} />
                  Profile Information
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                >
                  <Lock className="me-2" size={18} />
                  Change Password
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'preferences' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preferences')}
                >
                  <MapPin className="me-2" size={18} />
                  Preferences
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'danger' ? 'active' : ''}`}
                  onClick={() => setActiveTab('danger')}
                >
                  <Trash2 className="me-2" size={18} />
                  Account Settings
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-9">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Profile Information</h5>
                  {!isEditing ? (
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 size={16} className="me-1" />
                      Edit Profile
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setErrors({});
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div className="card-body">
                  <form onSubmit={handleUpdateProfile}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                          value={profileForm.name}
                          onChange={(e) => handleProfileInputChange('name', e.target.value)}
                          disabled={!isEditing}
                        />
                        <ValidationError error={errors.name} />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email *</label>
                        <input
                          type="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          value={profileForm.email}
                          onChange={(e) => handleProfileInputChange('email', e.target.value)}
                          disabled={!isEditing}
                        />
                        <ValidationError error={errors.email} />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Phone Number *</label>
                        <input
                          type="tel"
                          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                          value={profileForm.phone}
                          onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                        />
                        <ValidationError error={errors.phone} />
                      </div>
                      
                      <div className="col-12 mb-3">
                        <label className="form-label">Street Address</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profileForm.address.street}
                          onChange={(e) => handleProfileInputChange('street', e.target.value, 'address')}
                          disabled={!isEditing}
                          placeholder="Enter your street address"
                        />
                      </div>
                      
                      <div className="col-md-4 mb-3">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profileForm.address.city}
                          onChange={(e) => handleProfileInputChange('city', e.target.value, 'address')}
                          disabled={!isEditing}
                          placeholder="City"
                        />
                      </div>
                      
                      <div className="col-md-4 mb-3">
                        <label className="form-label">State</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profileForm.address.state}
                          onChange={(e) => handleProfileInputChange('state', e.target.value, 'address')}
                          disabled={!isEditing}
                          placeholder="State"
                        />
                      </div>
                      
                      <div className="col-md-4 mb-3">
                        <label className="form-label">ZIP Code</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profileForm.address.zipCode}
                          onChange={(e) => handleProfileInputChange('zipCode', e.target.value, 'address')}
                          disabled={!isEditing}
                          placeholder="ZIP"
                        />
                      </div>
                    </div>
                    
                    {isEditing && (
                      <div className="text-end">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="me-1" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Change Password</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleUpdatePassword}>
                    <div className="mb-3">
                      <label className="form-label">Current Password *</label>
                      <div className="input-group">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                          value={passwordForm.currentPassword}
                          onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <ValidationError error={errors.currentPassword} />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">New Password *</label>
                      <div className="input-group">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                          value={passwordForm.newPassword}
                          onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <ValidationError error={errors.newPassword} />
                      <small className="text-muted">Password must be at least 6 characters long</small>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Confirm New Password *</label>
                      <div className="input-group">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <ValidationError error={errors.confirmPassword} />
                    </div>
                    
                    <div className="text-end">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Lock size={16} className="me-1" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Preferences</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-12">
                      <h6>Notifications</h6>
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" id="emailNotifications" defaultChecked />
                        <label className="form-check-label" htmlFor="emailNotifications">
                          Email notifications for order updates
                        </label>
                      </div>
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" id="promoNotifications" defaultChecked />
                        <label className="form-check-label" htmlFor="promoNotifications">
                          Promotional emails and offers
                        </label>
                      </div>
                      <div className="form-check mb-4">
                        <input className="form-check-input" type="checkbox" id="smsNotifications" />
                        <label className="form-check-label" htmlFor="smsNotifications">
                          SMS notifications
                        </label>
                      </div>
                      
                      <h6>Delivery Preferences</h6>
                      <div className="mb-3">
                        <label className="form-label">Preferred delivery time</label>
                        <select className="form-select">
                          <option>As soon as possible</option>
                          <option>30-45 minutes</option>
                          <option>1 hour</option>
                          <option>2 hours</option>
                        </select>
                      </div>
                      
                      <div className="text-end">
                        <button className="btn btn-primary">
                          <Save size={16} className="me-1" />
                          Save Preferences
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h5 className="mb-0">Danger Zone</h5>
                </div>
                <div className="card-body">
                  <div className="alert alert-danger">
                    <strong>Warning!</strong> These actions cannot be undone. Please be careful.
                  </div>
                  
                  <div className="d-grid">
                    <button
                      className="btn btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Deleting Account...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} className="me-1" />
                          Delete Account
                        </>
                      )}
                    </button>
                  </div>
                  
                  <small className="text-muted">
                    This will permanently delete your account and all associated data.
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;