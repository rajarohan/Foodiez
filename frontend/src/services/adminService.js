import { adminAuthAPI, restaurantAPI, menuAPI, orderAPI } from './api';

// Admin-specific service functions
export const adminService = {
  // Authentication
  auth: {
    login: (credentials) => adminAuthAPI.login(credentials),
    register: (userData) => adminAuthAPI.register(userData),
    getProfile: () => adminAuthAPI.getProfile(),
    updateProfile: (data) => adminAuthAPI.updateProfile(data),
  },

  // Restaurant Management
  restaurants: {
    getAll: (params = {}) => restaurantAPI.getAll({ ...params, role: 'admin' }),
    getById: (id) => restaurantAPI.getById(id),
    create: (data) => restaurantAPI.create(data),
    update: (id, data) => restaurantAPI.update(id, data),
    delete: (id) => restaurantAPI.delete(id),
    getMenu: (restaurantId, params = {}) => restaurantAPI.getMenu(restaurantId, params),
    
    // Admin-specific restaurant operations
    getStats: (restaurantId) => restaurantAPI.getById(`${restaurantId}/stats`),
    toggleStatus: (id, isActive) => restaurantAPI.update(id, { isActive }),
    bulkUpdate: (ids, updates) => {
      return Promise.all(ids.map(id => restaurantAPI.update(id, updates)));
    },
  },

  // Menu Management
  menu: {
    getAll: (params = {}) => menuAPI.getAll({ ...params, role: 'admin' }),
    getById: (id) => menuAPI.getById(id),
    create: (data) => menuAPI.create(data),
    update: (id, data) => menuAPI.update(id, data),
    delete: (id) => menuAPI.delete(id),
    getCategories: () => menuAPI.getCategories(),
    
    // Admin-specific menu operations
    bulkUpdate: (ids, updates) => {
      return Promise.all(ids.map(id => menuAPI.update(id, updates)));
    },
    bulkDelete: (ids) => {
      return Promise.all(ids.map(id => menuAPI.delete(id)));
    },
    toggleAvailability: (id, isAvailable) => menuAPI.update(id, { isAvailable }),
  },

  // Order Management
  orders: {
    getAll: (params = {}) => orderAPI.getAll({ ...params, role: 'admin' }),
    getById: (id) => orderAPI.getById(id),
    updateStatus: (id, status) => orderAPI.updateStatus(id, status),
    getStats: (params = {}) => orderAPI.getStats(params),
    
    // Admin-specific order operations
    bulkUpdateStatus: (orderIds, status) => {
      return Promise.all(orderIds.map(id => orderAPI.updateStatus(id, status)));
    },
    
    getDailyStats: () => {
      const today = new Date().toISOString().split('T')[0];
      return orderAPI.getStats({ date: today });
    },
    
    getWeeklyStats: () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderAPI.getStats({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
    },
    
    getMonthlyStats: () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      return orderAPI.getStats({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
    },
  },

  // Dashboard Analytics
  dashboard: {
    getOverview: async () => {
      try {
        const [
          todayStats,
          weeklyStats,
          monthlyStats,
          recentOrders,
          topRestaurants,
          topMenuItems
        ] = await Promise.all([
          adminService.orders.getDailyStats(),
          adminService.orders.getWeeklyStats(),
          adminService.orders.getMonthlyStats(),
          orderAPI.getAll({ limit: 10, sort: '-createdAt' }),
          restaurantAPI.getAll({ limit: 5, sort: '-rating' }),
          menuAPI.getAll({ limit: 5, sort: '-orderCount' })
        ]);

        return {
          stats: {
            today: todayStats.data,
            weekly: weeklyStats.data,
            monthly: monthlyStats.data,
          },
          recentOrders: recentOrders.data,
          topRestaurants: topRestaurants.data,
          topMenuItems: topMenuItems.data,
        };
      } catch (error) {
        throw new Error('Failed to fetch dashboard data');
      }
    },

    getRevenue: async (period = 'monthly') => {
      const stats = await orderAPI.getStats({ 
        period,
        groupBy: 'revenue' 
      });
      return stats.data;
    },

    getOrderTrends: async (period = 'daily') => {
      const stats = await orderAPI.getStats({ 
        period,
        groupBy: 'orders' 
      });
      return stats.data;
    },
  },

  // User Management (if needed for admin panel)
  users: {
    // These would need corresponding backend endpoints
    getCustomers: (params = {}) => {
      // This would need a dedicated endpoint
      return Promise.resolve({ data: [], pagination: null });
    },
    
    getAdmins: (params = {}) => {
      // This would need a dedicated endpoint
      return Promise.resolve({ data: [], pagination: null });
    },
  },

  // Utility functions
  utils: {
    exportData: (type, params = {}) => {
      // Export functionality for reports
      const endpoints = {
        orders: () => orderAPI.getAll({ ...params, export: true }),
        restaurants: () => restaurantAPI.getAll({ ...params, export: true }),
        menu: () => menuAPI.getAll({ ...params, export: true }),
      };
      
      return endpoints[type] ? endpoints[type]() : Promise.reject(new Error('Invalid export type'));
    },

    generateReport: async (type, period = 'monthly') => {
      try {
        switch (type) {
          case 'sales':
            return await adminService.dashboard.getRevenue(period);
          case 'orders':
            return await adminService.dashboard.getOrderTrends(period);
          case 'overview':
            return await adminService.dashboard.getOverview();
          default:
            throw new Error('Invalid report type');
        }
      } catch (error) {
        throw new Error(`Failed to generate ${type} report`);
      }
    },
  },
};

export default adminService;