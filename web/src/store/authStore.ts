import { create } from "zustand";
import api from "../utils/api";

type User = {
  id: number;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  checkAuth: () => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("userToken", token);
      window.localStorage.setItem("userData", JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true });
  },
  checkAuth: () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("userToken");
    const userData = window.localStorage.getItem("userData");
    if (token && userData) {
      set({ token, user: JSON.parse(userData), isAuthenticated: true });
      return;
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
  logout: async () => {
    if (typeof window !== "undefined") {
      try {
        await api.post("/auth/logout");
      } catch (error) {
        // token already invalid/expired or offline — still clear local session
      }
      window.localStorage.removeItem("userToken");
      window.localStorage.removeItem("userData");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
