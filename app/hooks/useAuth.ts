import { useAuthStore } from "@/stores/auth.store";
import { roleCan, type Capability } from "@/lib/permissions";

/**
 * Reactive capability check. Subscribes to the role alone, so a component
 * gating on this re-renders when the session changes but not on unrelated
 * store writes (loading flags, errors).
 */
export function useCan(capability: Capability): boolean {
  return useAuthStore((state) => roleCan(state.admin?.role, capability));
}

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
