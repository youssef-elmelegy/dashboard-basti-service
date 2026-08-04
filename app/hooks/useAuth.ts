import { useAuthStore } from "@/stores/auth.store";

export function useAuth() {
  const {
    admin,
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

  // No mount-time session probe here: auth is cookie-based and AuthInitializer
  // runs the single checkAuth() for the whole app.

  return {
    // State
    admin,
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
