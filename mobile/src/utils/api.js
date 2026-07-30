import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_PORT = 5000;
// Manual fallback — only used if the Expo host can't be auto-detected (e.g. a
// production build). Set to your dev PC's LAN IP if you ever need it.
const FALLBACK_HOST = '192.168.1.5';

// Auto-detect the dev machine's LAN IP from the Expo/Metro connection so we never
// have to hardcode it — it changes whenever the network changes. In Expo Go the
// phone is already talking to Metro at this exact host, so it's always reachable.
const resolveDevHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;
  const host = hostUri ? hostUri.split(':')[0] : null;
  // Emulators can't reach the host via its LAN IP the same way; use their aliases.
  if (host === 'localhost' || host === '127.0.0.1') {
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }
  return host || FALLBACK_HOST;
};

export const API_URL = `http://${resolveDevHost()}:${API_PORT}/api`;

// Origin without the /api suffix, e.g. http://192.168.10.4:5000 — used to build
// image URLs. The backend bakes its own LAN IP into stored image_url values, so
// we rewrite whatever host is embedded to match API_URL's host (mirrors web's
// getImageUrl). Pass a stored image_url; returns null when there's nothing usable.
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  if (/^https?:\/\//i.test(url)) return url.replace(/^https?:\/\/[^/]+/i, API_ORIGIN);
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Fail fast instead of hanging indefinitely when the server is unreachable —
  // this is what made sign-in "take forever" with no feedback.
  timeout: 15000,
});

// INTERCEPTOR: Automatically adds token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → wipe SecureStore and reset auth. AppNavigator watches
// isAuthenticated and swaps back to the Auth stack automatically, so no
// manual navigation is needed. Dynamic import breaks the api <-> store
// circular dependency at load time.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401) {
      try {
        const { useAuthStore } = await import('../store/useAuthStore');
        await useAuthStore.getState().logout();
      } catch (e) {
        // Fallback if the store fails to load — clear tokens directly.
        try {
          await SecureStore.deleteItemAsync('userToken');
          await SecureStore.deleteItemAsync('userData');
        } catch {}
      }
    }
    return Promise.reject(err);
  },
);

export default api;