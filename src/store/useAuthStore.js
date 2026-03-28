import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  // Set user after login
  setAuth: async (user, token) => {
    await SecureStore.setItemAsync('userToken', token);
    set({ user, token, isAuthenticated: true });
  },

  // Check if user is already logged in (for Splash Screen)
  checkAuth: async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      // In a real app, you would verify the token with the backend here
      set({ token, isAuthenticated: true });
      return true;
    }
    return false;
  },

  // Logout
  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));