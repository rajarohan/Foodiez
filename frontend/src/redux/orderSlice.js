import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderAPI } from '../services/api';

// Initial state
const initialState = {
  orders: [],
  currentOrder: null,
  orderStats: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {
    status: '',
    date: '',
    customer: '',
    restaurant: '',
  },
};

// Async thunks
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await orderAPI.create(orderData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const getOrders = createAsyncThunk(
  'orders/getOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const getOrderById = createAsyncThunk(
  'orders/getOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

export const getUserOrders = createAsyncThunk(
  'orders/getUserOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getUserOrders(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await orderAPI.updateStatus(id, status);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderAPI.cancel(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

export const getOrderStats = createAsyncThunk(
  'orders/getOrderStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getStats(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order statistics');
    }
  }
);

export const trackOrder = createAsyncThunk(
  'orders/trackOrder',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderAPI.track(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to track order');
    }
  }
);

export const reorderItems = createAsyncThunk(
  'orders/reorderItems',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await orderAPI.reorder(orderId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reorder items');
    }
  }
);

// Order slice
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        status: '',
        date: '',
        customer: '',
        restaurant: '',
      };
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    updateOrderInList: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.orders.findIndex(order => order._id === id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.data;
        state.orders.unshift(action.payload.data);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Orders
      .addCase(getOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Order by ID
      .addCase(getOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.data;
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get User Orders
      .addCase(getUserOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getUserOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedOrder = action.payload.data;
        
        // Update in orders list
        const index = state.orders.findIndex(order => order._id === updatedOrder._id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const cancelledOrder = action.payload.data;
        
        // Update in orders list
        const index = state.orders.findIndex(order => order._id === cancelledOrder._id);
        if (index !== -1) {
          state.orders[index] = cancelledOrder;
        }
        
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder._id === cancelledOrder._id) {
          state.currentOrder = cancelledOrder;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Order Stats
      .addCase(getOrderStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderStats = action.payload.data;
      })
      .addCase(getOrderStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Track Order
      .addCase(trackOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(trackOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.data;
      })
      .addCase(trackOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reorder Items
      .addCase(reorderItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reorderItems.fulfilled, (state) => {
        state.isLoading = false;
        // The reordered items are typically added to cart, not orders
        // This just acknowledges successful reordering
      })
      .addCase(reorderItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  setFilters, 
  clearFilters, 
  clearCurrentOrder, 
  updateOrderInList 
} = orderSlice.actions;

export default orderSlice.reducer;