import { create } from "zustand";

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
  logout: () => void;
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
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("userToken");
      window.localStorage.removeItem("userData");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
