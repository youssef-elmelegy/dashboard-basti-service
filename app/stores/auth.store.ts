import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api/auth.api";
import type { AdminLoginRequest } from "@/lib/api/auth.api";
import { getApiErrorMessage } from "@/lib/api-client";
// Loaded on demand rather than imported statically: fcm.service pulls in
// @/config/firebase, which drags the whole Firebase SDK (~200 KB) into
// whatever chunk imports it. This store is reachable from the login page via
// PublicRoute, so a static import puts Firebase on the critical path of the
// one screen that has no use for push notifications. Every consumer below is
// already async or fire-and-forget, so deferring the load costs nothing.
const fcmService = () => import("@/lib/services/fcm.service");
import {
  syncLanguageWithBackend,
  resetLanguageSyncCache,
} from "@/lib/services/language.service";
import i18n from "@/i18n/config";

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
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /**
   * Bumped every time the session is deliberately established or torn down
   * (login / logout). An in-flight checkAuth compares it against the value it
   * started with to tell "still the session I was asked about" from "a login
   * happened while I was waiting", and stays silent in the latter case.
   */
  sessionEpoch: number;

  // Actions
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  // Both rely on the httpOnly resetToken cookie set by verify-otp; the token
  // is never exposed to JS, so neither takes nor returns it.
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
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
      sessionEpoch: 0,

      login: async (credentials: AdminLoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          if (response.success && response.data) {
            set({
              admin: response.data.admin,
              isAuthenticated: true,
              isLoading: false,
              // Invalidate any checkAuth still in flight from before this
              // login — its answer predates the session and must not land.
              sessionEpoch: get().sessionEpoch + 1,
            });

            // Register an FCM push token for this admin so the backend can
            // deliver real-time notifications. Fire-and-forget — login must
            // not block on browser push permission.
            void fcmService().then((m) => m.registerFcmWithBackend());

            // Sync the dashboard language so pushes for this admin arrive in
            // the language they're actually reading the dashboard in.
            void syncLanguageWithBackend(i18n.language);
          } else {
            throw new Error(response.message || "Login failed");
          }
        } catch (error) {
          const errorMessage = getApiErrorMessage(error, "Login failed");
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        // Clear FCM registration BEFORE logout so the DELETE call still
        // has a valid auth cookie. Server-side stops targeting this admin
        // and the browser push subscription is unsubscribed so the next
        // login mints a fresh token.
        await (await fcmService()).clearFcmRegistration();
        try {
          await authApi.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Already resolved — clearFcmRegistration above loaded the module,
          // and dynamic imports cache, so this awaits a settled promise.
          (await fcmService()).resetFcmRegistrationCache();
          resetLanguageSyncCache();
          set({
            admin: null,
            isAuthenticated: false,
            isLoading: false,
            // Same reasoning as login: a checkAuth that started before this
            // logout must not restore the session it already saw.
            sessionEpoch: get().sessionEpoch + 1,
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
          const errorMessage = getApiErrorMessage(error, "Failed to send OTP");
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      verifyOtp: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.verifyOtp({ email, otp });
          if (response.success && response.data) {
            set({ isLoading: false });
          } else {
            throw new Error(response.message || "OTP verification failed");
          }
        } catch (error) {
          const errorMessage = getApiErrorMessage(
            error,
            "OTP verification failed",
          );
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      resetPassword: async (newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.resetPassword({
            newPassword,
          });
          if (!response.success) {
            throw new Error(response.message || "Password reset failed");
          }
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = getApiErrorMessage(
            error,
            "Password reset failed",
          );
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });

        // Snapshot the session generation this probe started from. A probe that
        // began before a login must not be allowed to publish its (stale)
        // "logged out" answer over that login's result — see clearIfCurrent.
        const startedAt = get().sessionEpoch;

        /**
         * Clear the session only if no login landed while this probe was in
         * flight. AuthInitializer fires checkAuth on every cold load including
         * /auth/login, where it 401s because there is no cookie yet. If the
         * user signs in during that window, the late 401 would otherwise reset
         * isAuthenticated to false and strand them on the login page with a
         * perfectly good session.
         */
        const clearIfCurrent = () => {
          if (get().sessionEpoch !== startedAt) return;
          set({ admin: null, isAuthenticated: false, isLoading: false });
        };

        try {
          const response = await authApi.checkAuth();
          if (
            response.success &&
            response.data?.isAuthenticated &&
            response.data.admin
          ) {
            // A logout that landed mid-probe already bumped the epoch; honour
            // it rather than resurrecting the session this response describes.
            if (get().sessionEpoch !== startedAt) {
              set({ isLoading: false });
              return;
            }

            set({
              admin: response.data.admin,
              isAuthenticated: true,
              isLoading: false,
            });

            // Re-register the FCM token for the restored session so a
            // browser-restart admin still gets push delivery.
            void fcmService().then((m) => m.registerFcmWithBackend());
            void syncLanguageWithBackend(i18n.language);
          } else {
            clearIfCurrent();
          }
        } catch (error) {
          console.error("Auth check error:", error);
          clearIfCurrent();
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
