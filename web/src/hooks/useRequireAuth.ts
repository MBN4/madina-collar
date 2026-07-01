import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export const useRequireAuth = () => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, router]);

  return isAuthenticated;
};
