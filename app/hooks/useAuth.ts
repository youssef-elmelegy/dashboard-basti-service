import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

export function useAuth() {
  const {
    admin,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword,
    checkAuth,
    clearError,
    isSuperAdmin,
    isAdmin,
    isManager,
    canViewAllContent,
    canViewBakeryOrders,
  } = useAuthStore();

  useEffect(() => {
    // Check auth status on mount
    if (!isAuthenticated && accessToken) {
      checkAuth();
    }
  }, []);

  return {
    // State
    admin,
    accessToken,
    isAuthenticated,
    isLoading,
    error,

    // Auth methods
    login,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword,
    checkAuth,
    clearError,

    // Role checks
    isSuperAdmin,
    isAdmin,
    isManager,
    canViewAllContent,
    canViewBakeryOrders,
  };
}
