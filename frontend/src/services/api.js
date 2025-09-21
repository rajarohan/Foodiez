import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password, role) => {
    if (role === 'admin') {
      return api.post('/admin/login', { email, password });
    } else {
      return api.post('/customer/login', { email, password });
    }
  },
  register: (userData) => {
    if (userData.role === 'admin') {
      return api.post('/admin/register', userData);
    } else {
      return api.post('/customer/register', userData);
    }
  },
  getProfile: (role) => {
    if (role === 'admin') {
      return api.get('/admin/profile');
    } else {
      return api.get('/customer/profile');
    }
  },
  updateProfile: (data, role) => {
    if (role === 'admin') {
      return api.put('/admin/profile', data);
    } else {
      return api.put('/customer/profile', data);
    }
  },
  updatePassword: (data, role) => {
    if (role === 'admin') {
      return api.put('/admin/password', data);
    } else {
      return api.put('/customer/password', data);
    }
  },
  deleteAccount: (role) => {
    if (role === 'admin') {
      return api.delete('/admin/account');
    } else {
      return api.delete('/customer/account');
    }
  },
};

// Admin Auth API (kept for backward compatibility)
export const adminAuthAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  register: (userData) => api.post('/admin/register', userData),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
};

// Restaurant API
export const restaurantAPI = {
  getAll: (params = {}) => api.get('/restaurants', { params }),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
  getMenu: (restaurantId, params = {}) => api.get(`/restaurants/${restaurantId}/menu`, { params }),
};

// Menu API
export const menuAPI = {
  getAll: (params = {}) => api.get('/menu', { params }),
  getById: (id) => api.get(`/menu/${id}`),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
  getCategories: () => api.get('/menu/categories'),
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (itemId, data) => api.put(`/cart/item/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/item/${itemId}`),
  clear: () => api.delete('/cart'),
  getSummary: () => api.get('/cart/summary'),
};

// Order API
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params = {}) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getUserOrders: (params = {}) => api.get('/orders/my-orders', { params }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  getStats: (params = {}) => api.get('/orders/stats', { params }),
  track: (id) => api.get(`/orders/${id}/track`),
  reorder: (id) => api.post(`/orders/${id}/reorder`),
};

// Upload API
export const uploadAPI = {
  single: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  multiple: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    return api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;