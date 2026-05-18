import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  setAuth: async (user, token) => {
    await SecureStore.setItemAsync('userToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userData = await SecureStore.getItemAsync('userData');
      if (token && userData) {
        set({ 
          token, 
          user: JSON.parse(userData), 
          isAuthenticated: true 
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));