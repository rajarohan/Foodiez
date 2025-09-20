import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/update-details', data),
  updatePassword: (data) => api.put('/auth/update-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// Restaurant endpoints
export const restaurantAPI = {
  getAll: (params) => api.get('/restaurants', { params }),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
  getNearby: (lat, lng, distance) => api.get(`/restaurants/nearby/${lat}/${lng}/${distance}`),
  getStats: () => api.get('/restaurants/stats'),
  uploadPhoto: (id, formData) => api.put(`/restaurants/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Menu endpoints
export const menuAPI = {
  getAll: (params) => api.get('/menu', { params }),
  getById: (id) => api.get(`/menu/${id}`),
  getByRestaurant: (restaurantId) => api.get(`/menu/restaurant/${restaurantId}`),
  getCategories: (restaurantId) => api.get(`/menu/restaurant/${restaurantId}/categories`),
  getFeatured: () => api.get('/menu/featured'),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
  getStats: () => api.get('/menu/stats'),
  uploadPhoto: (id, formData) => api.put(`/menu/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Cart endpoints
export const cartAPI = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (itemIndex, data) => api.put(`/cart/items/${itemIndex}`, data),
  removeItem: (itemIndex) => api.delete(`/cart/items/${itemIndex}`),
  clear: () => api.delete('/cart'),
  applyCoupon: (couponCode) => api.post('/cart/coupon', { couponCode }),
  removeCoupon: () => api.delete('/cart/coupon'),
  validate: () => api.post('/cart/validate'),
};

// Order endpoints
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  addRating: (id, rating) => api.put(`/orders/${id}/rating`, rating),
  getByRestaurant: (restaurantId, params) => api.get(`/orders/restaurant/${restaurantId}`, { params }),
  getStats: () => api.get('/orders/stats'),
};

export default api;