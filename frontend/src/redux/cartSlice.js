import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../services/api';

// Initial state
const initialState = {
  items: [],
  restaurant: null,
  totalAmount: 0,
  deliveryFee: 0,
  taxes: 0,
  grandTotal: 0,
  isLoading: false,
  error: null,
  cartSummary: null,
};

// Async thunks
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCart();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ menuItemId, quantity, specialInstructions }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.addToCart({ menuItemId, quantity, specialInstructions });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity, specialInstructions }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateCartItem(itemId, { quantity, specialInstructions });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart item');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await cartAPI.removeFromCart(itemId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove item from cart');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.clearCart();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

export const getCartSummary = createAsyncThunk(
  'cart/getCartSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCartSummary();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get cart summary');
    }
  }
);

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCartState: (state) => {
      state.items = [];
      state.restaurant = null;
      state.totalAmount = 0;
      state.deliveryFee = 0;
      state.taxes = 0;
      state.grandTotal = 0;
      state.cartSummary = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Cart
      .addCase(getCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data.items) {
          state.items = action.payload.data.items;
          state.restaurant = action.payload.data.restaurant;
          state.totalAmount = action.payload.data.totalAmount;
          state.deliveryFee = action.payload.data.deliveryFee;
          state.taxes = action.payload.data.taxes;
          state.grandTotal = action.payload.data.grandTotal;
        } else {
          // Empty cart
          state.items = [];
          state.restaurant = null;
          state.totalAmount = 0;
          state.deliveryFee = 0;
          state.taxes = 0;
          state.grandTotal = 0;
        }
      })
      .addCase(getCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data.items;
        state.restaurant = action.payload.data.restaurant;
        state.totalAmount = action.payload.data.totalAmount;
        state.deliveryFee = action.payload.data.deliveryFee;
        state.taxes = action.payload.data.taxes;
        state.grandTotal = action.payload.data.grandTotal;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Cart Item
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data.items;
        state.totalAmount = action.payload.data.totalAmount;
        state.deliveryFee = action.payload.data.deliveryFee;
        state.taxes = action.payload.data.taxes;
        state.grandTotal = action.payload.data.grandTotal;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data.items;
        state.totalAmount = action.payload.data.totalAmount;
        state.deliveryFee = action.payload.data.deliveryFee;
        state.taxes = action.payload.data.taxes;
        state.grandTotal = action.payload.data.grandTotal;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.restaurant = null;
        state.totalAmount = 0;
        state.deliveryFee = 0;
        state.taxes = 0;
        state.grandTotal = 0;
        state.cartSummary = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Cart Summary
      .addCase(getCartSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCartSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cartSummary = action.payload.data;
      })
      .addCase(getCartSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCartState } = cartSlice.actions;
export default cartSlice.reducer;