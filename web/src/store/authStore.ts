import { create } from "zustand";
import api from "../utils/api";

// Decode a JWT (header.payload.signature) without a lib and check its exp
// claim. If the token is malformed or has no exp, treat it as expired so we
// fall back to a fresh login rather than trusting a broken token.
const isJwtExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      typeof atob !== "undefined"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("utf8"),
    );
    if (!payload?.exp) return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

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
    // Preemptively drop an expired token so protected pages don't flash their
    // authenticated state and immediately 401 — this catches the case where
    // JWT expired while the tab was closed.
    if (token && isJwtExpired(token)) {
      window.localStorage.removeItem("userToken");
      window.localStorage.removeItem("userData");
      set({ token: null, user: null, isAuthenticated: false });
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
      return;
    }
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
