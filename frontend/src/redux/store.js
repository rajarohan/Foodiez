import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import cartSlice from './cartSlice';
import restaurantSlice from './restaurantSlice';
import orderSlice from './orderSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cart: cartSlice,
    restaurants: restaurantSlice,
    orders: orderSlice,
  },
});

export default store;