import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { restaurantAPI, menuAPI } from '../services/api';

// Initial state
const initialState = {
  restaurants: [],
  currentRestaurant: null,
  menuItems: [],
  categories: [],
  isLoading: false,
  error: null,
  pagination: null,
  filters: {
    search: '',
    cuisine: '',
    city: '',
    minRating: '',
    priceRange: '',
  },
};

// Async thunks
export const getRestaurants = createAsyncThunk(
  'restaurants/getRestaurants',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await restaurantAPI.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch restaurants');
    }
  }
);

export const getRestaurant = createAsyncThunk(
  'restaurants/getRestaurant',
  async (id, { rejectWithValue }) => {
    try {
      const response = await restaurantAPI.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch restaurant');
    }
  }
);

export const getRestaurantMenu = createAsyncThunk(
  'restaurants/getRestaurantMenu',
  async ({ restaurantId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await restaurantAPI.getMenu(restaurantId, params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu');
    }
  }
);

export const createRestaurant = createAsyncThunk(
  'restaurants/createRestaurant',
  async (restaurantData, { rejectWithValue }) => {
    try {
      const response = await restaurantAPI.create(restaurantData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create restaurant');
    }
  }
);

export const updateRestaurant = createAsyncThunk(
  'restaurants/updateRestaurant',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await restaurantAPI.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update restaurant');
    }
  }
);

export const deleteRestaurant = createAsyncThunk(
  'restaurants/deleteRestaurant',
  async (id, { rejectWithValue }) => {
    try {
      const response = await restaurantAPI.delete(id);
      return { id, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete restaurant');
    }
  }
);

export const getMenuItems = createAsyncThunk(
  'restaurants/getMenuItems',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu items');
    }
  }
);

export const createMenuItem = createAsyncThunk(
  'restaurants/createMenuItem',
  async (menuItemData, { rejectWithValue }) => {
    try {
      const response = await menuAPI.create(menuItemData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create menu item');
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  'restaurants/updateMenuItem',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await menuAPI.update(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update menu item');
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  'restaurants/deleteMenuItem',
  async (id, { rejectWithValue }) => {
    try {
      const response = await menuAPI.delete(id);
      return { id, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete menu item');
    }
  }
);

export const getCategories = createAsyncThunk(
  'restaurants/getCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getCategories();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

// Restaurant slice
const restaurantSlice = createSlice({
  name: 'restaurants',
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
        search: '',
        cuisine: '',
        city: '',
        minRating: '',
        priceRange: '',
      };
    },
    clearCurrentRestaurant: (state) => {
      state.currentRestaurant = null;
      state.menuItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Restaurants
      .addCase(getRestaurants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRestaurants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.restaurants = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getRestaurants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Restaurant
      .addCase(getRestaurant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRestaurant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRestaurant = action.payload.data;
      })
      .addCase(getRestaurant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Restaurant Menu
      .addCase(getRestaurantMenu.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRestaurantMenu.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuItems = action.payload.data;
      })
      .addCase(getRestaurantMenu.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Restaurant
      .addCase(createRestaurant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRestaurant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.restaurants.unshift(action.payload.data);
      })
      .addCase(createRestaurant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Restaurant
      .addCase(updateRestaurant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRestaurant.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.restaurants.findIndex(r => r._id === action.payload.data._id);
        if (index !== -1) {
          state.restaurants[index] = action.payload.data;
        }
        if (state.currentRestaurant && state.currentRestaurant._id === action.payload.data._id) {
          state.currentRestaurant = action.payload.data;
        }
      })
      .addCase(updateRestaurant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Restaurant
      .addCase(deleteRestaurant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteRestaurant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.restaurants = state.restaurants.filter(r => r._id !== action.payload.id);
      })
      .addCase(deleteRestaurant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Menu Items
      .addCase(getMenuItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMenuItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuItems = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getMenuItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Menu Item
      .addCase(createMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuItems.unshift(action.payload.data);
      })
      .addCase(createMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Menu Item
      .addCase(updateMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.menuItems.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.menuItems[index] = action.payload.data;
        }
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Menu Item
      .addCase(deleteMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menuItems = state.menuItems.filter(item => item._id !== action.payload.id);
      })
      .addCase(deleteMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Categories
      .addCase(getCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.data;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setFilters, clearFilters, clearCurrentRestaurant } = restaurantSlice.actions;
export default restaurantSlice.reducer;