import type { AxiosInstance } from "axios";
import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://192.168.18.18:5000/api";

export const getImageUrl = (url: string) => {
  if (!url) return "";
  const backendBase = API_URL.replace(/\/api\/?$/, "");

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsedUrl = new URL(url);
      return `${backendBase}${parsedUrl.pathname}${parsedUrl.search}`;
    } catch (e) {
      return url.replace(/https?:\/\/[^\/]+/, backendBase);
    }
  }

  if (url.startsWith("/")) {
    return `${backendBase}${url}`;
  }
  return `${backendBase}/${url}`;
};

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("userToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Clear auth data on 401
      window.localStorage.removeItem("userToken");
      window.localStorage.removeItem("userData");
      // Redirect to login if not already there
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
