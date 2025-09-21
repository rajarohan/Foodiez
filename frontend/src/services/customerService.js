import { authAPI, restaurantAPI, menuAPI, cartAPI, orderAPI } from './api';

// Customer-specific service functions
export const customerService = {
  // Authentication
  auth: {
    login: (credentials) => authAPI.login(credentials),
    register: (userData) => authAPI.register(userData),
    getProfile: () => authAPI.getProfile(),
    updateProfile: (data) => authAPI.updateProfile(data),
  },

  // Restaurant browsing
  restaurants: {
    getAll: (params = {}) => restaurantAPI.getAll(params),
    getById: (id) => restaurantAPI.getById(id),
    getMenu: (restaurantId, params = {}) => restaurantAPI.getMenu(restaurantId, params),
    
    // Customer-specific restaurant operations
    search: (query, filters = {}) => {
      return restaurantAPI.getAll({ 
        search: query, 
        ...filters,
        isActive: true // Only show active restaurants to customers
      });
    },
    
    getByLocation: (latitude, longitude, radius = 10) => {
      return restaurantAPI.getAll({
        latitude,
        longitude,
        radius,
        isActive: true
      });
    },
    
    getByCategory: (cuisine, params = {}) => {
      return restaurantAPI.getAll({
        cuisine,
        isActive: true,
        ...params
      });
    },
    
    getFeatured: (limit = 6) => {
      return restaurantAPI.getAll({
        featured: true,
        limit,
        isActive: true
      });
    },
    
    getRecommended: (userId, limit = 6) => {
      return restaurantAPI.getAll({
        recommended: userId,
        limit,
        isActive: true
      });
    },
  },

  // Menu browsing
  menu: {
    getByRestaurant: (restaurantId, params = {}) => {
      return restaurantAPI.getMenu(restaurantId, {
        isAvailable: true, // Only show available items
        ...params
      });
    },
    
    search: (query, filters = {}) => {
      return menuAPI.getAll({
        search: query,
        isAvailable: true,
        ...filters
      });
    },
    
    getCategories: () => menuAPI.getCategories(),
    
    getPopular: (limit = 10) => {
      return menuAPI.getAll({
        popular: true,
        limit,
        isAvailable: true
      });
    },
    
    getByCategory: (category, params = {}) => {
      return menuAPI.getAll({
        category,
        isAvailable: true,
        ...params
      });
    },
  },

  // Cart management
  cart: {
    get: () => cartAPI.get(),
    add: (menuItemId, quantity = 1, customization = {}) => {
      return cartAPI.add({
        menuItemId,
        quantity,
        customization
      });
    },
    update: (itemId, quantity) => cartAPI.update(itemId, { quantity }),
    remove: (itemId) => cartAPI.remove(itemId),
    clear: () => cartAPI.clear(),
    getSummary: () => cartAPI.getSummary(),
    
    // Customer-specific cart operations
    addMultiple: (items) => {
      return Promise.all(
        items.map(item => cartAPI.add(item))
      );
    },
    
    validateCart: () => {
      // Check if all cart items are still available
      return cartAPI.get().then(cart => {
        if (!cart.data.items.length) return cart;
        
        // Validate each item's availability
        const validationPromises = cart.data.items.map(item =>
          menuAPI.getById(item.menuItem._id)
        );
        
        return Promise.all(validationPromises).then(menuItems => {
          const unavailableItems = menuItems
            .map((item, index) => ({ item, cartItem: cart.data.items[index] }))
            .filter(({ item }) => !item.data.isAvailable);
            
          return {
            ...cart,
            unavailableItems: unavailableItems.map(({ cartItem }) => cartItem)
          };
        });
      });
    },
  },

  // Order management
  orders: {
    create: (orderData) => orderAPI.create(orderData),
    getMyOrders: (params = {}) => orderAPI.getUserOrders(params),
    getById: (id) => orderAPI.getById(id),
    track: (id) => orderAPI.track(id),
    cancel: (id) => orderAPI.cancel(id),
    
    // Customer-specific order operations
    reorder: async (orderId) => {
      try {
        const order = await orderAPI.getById(orderId);
        const items = order.data.items;
        
        // Clear current cart and add items from previous order
        await cartAPI.clear();
        return await customerService.cart.addMultiple(items.map(item => ({
          menuItemId: item.menuItem._id,
          quantity: item.quantity,
          customization: item.customization
        })));
      } catch (error) {
        throw new Error('Failed to reorder items');
      }
    },
    
    getRecent: (limit = 5) => {
      return orderAPI.getUserOrders({
        limit,
        sort: '-createdAt'
      });
    },
    
    getByStatus: (status, params = {}) => {
      return orderAPI.getUserOrders({
        status,
        ...params
      });
    },
  },

  // User preferences and features
  preferences: {
    getFavoriteRestaurants: () => {
      // This would need backend support
      return Promise.resolve({ data: [] });
    },
    
    addFavoriteRestaurant: (restaurantId) => {
      // This would need backend support
      return Promise.resolve({ success: true });
    },
    
    removeFavoriteRestaurant: (restaurantId) => {
      // This would need backend support
      return Promise.resolve({ success: true });
    },
    
    getOrderHistory: (params = {}) => {
      return orderAPI.getUserOrders(params);
    },
    
    getRecommendations: () => {
      // This would need backend support for ML recommendations
      return Promise.resolve({ data: [] });
    },
  },

  // Search and discovery
  search: {
    global: async (query) => {
      try {
        const [restaurants, menuItems] = await Promise.all([
          customerService.restaurants.search(query),
          customerService.menu.search(query)
        ]);
        
        return {
          restaurants: restaurants.data,
          menuItems: menuItems.data,
          query
        };
      } catch (error) {
        throw new Error('Search failed');
      }
    },
    
    restaurants: (query, filters) => customerService.restaurants.search(query, filters),
    
    menuItems: (query, filters) => customerService.menu.search(query, filters),
    
    suggestions: (query) => {
      // This would return search suggestions
      return Promise.resolve({ data: [] });
    },
  },

  // Delivery and location
  delivery: {
    checkAvailability: (address) => {
      // Check if delivery is available to the address
      return Promise.resolve({ available: true, estimatedTime: 30 });
    },
    
    estimateTime: (restaurantId, address) => {
      // Estimate delivery time
      return Promise.resolve({ estimatedTime: 30 });
    },
    
    calculateFee: (restaurantId, address) => {
      // Calculate delivery fee
      return Promise.resolve({ fee: 2.99 });
    },
  },

  // Reviews and ratings (if implemented)
  reviews: {
    getForRestaurant: (restaurantId, params = {}) => {
      // This would need backend support
      return Promise.resolve({ data: [], pagination: null });
    },
    
    getForMenuItem: (menuItemId, params = {}) => {
      // This would need backend support
      return Promise.resolve({ data: [], pagination: null });
    },
    
    add: (reviewData) => {
      // This would need backend support
      return Promise.resolve({ success: true });
    },
  },
};

export default customerService;