import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api/auth.api";
import type { AdminLoginRequest } from "@/lib/api/auth.api";

export interface Admin {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "manager";
  profileImage?: string;
  bakeryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  admin: Admin | null;
  accessToken?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<string>; // returns resetToken
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;

  // Role-based checks
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  canViewAllContent: () => boolean;
  canViewBakeryOrders: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: AdminLoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          if (response.success && response.data) {
            set({
              admin: response.data.admin,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || "Login failed");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Login failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.forgotPassword({ email });
          if (!response.success) {
            throw new Error(response.message || "Failed to send OTP");
          }
          set({ isLoading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to send OTP";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      verifyOtp: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.verifyOtp({ email, otp });
          if (response.success && response.data) {
            set({ isLoading: false });
            return response.data.resetToken;
          } else {
            throw new Error(response.message || "OTP verification failed");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "OTP verification failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      resetPassword: async (resetToken: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.resetPassword({
            resetToken,
            newPassword,
          });
          if (!response.success) {
            throw new Error(response.message || "Password reset failed");
          }
          set({ isLoading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Password reset failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const response = await authApi.checkAuth();
          if (
            response.success &&
            response.data?.isAuthenticated &&
            response.data.admin
          ) {
            set({
              admin: response.data.admin,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              admin: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Auth check error:", error);
          set({
            admin: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      // Role-based checks
      isSuperAdmin: () => get().admin?.role === "super_admin",
      isAdmin: () => get().admin?.role === "admin",
      isManager: () => get().admin?.role === "manager",
      canViewAllContent: () => {
        const role = get().admin?.role;
        return role === "super_admin" || role === "admin";
      },
      canViewBakeryOrders: () => {
        const role = get().admin?.role;
        return role === "manager" || role === "super_admin" || role === "admin";
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
