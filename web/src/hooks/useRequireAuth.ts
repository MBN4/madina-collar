import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";

export const useRequireAuth = () => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth();
    setChecked(true);
  }, [checkAuth]);

  useEffect(() => {
    if (checked && typeof window !== "undefined" && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [checked, isAuthenticated, router]);

  return checked ? isAuthenticated : false;
};
