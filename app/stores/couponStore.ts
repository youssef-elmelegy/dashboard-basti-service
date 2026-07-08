import { create } from "zustand";
import {
  couponApi,
  type Coupon,
  type GenerateCouponPayload,
  type UpdateCouponPayload,
} from "@/lib/services/coupon.service";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const obj = error as { message?: unknown; details?: unknown };
    if (Array.isArray(obj.details) && obj.details.length > 0) {
      return obj.details.filter((d) => typeof d === "string").join("; ");
    }
    if (typeof obj.details === "string" && obj.details.length > 0) {
      return obj.details;
    }
    if (typeof obj.message === "string" && obj.message.length > 0) {
      return obj.message;
    }
  }
  if (typeof error === "string" && error.length > 0) return error;
  return fallback;
}

interface CouponState {
  coupons: Coupon[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isCached: boolean;

  fetchCoupons: (forceRefresh?: boolean) => Promise<void>;
  createCoupon: (data: GenerateCouponPayload) => Promise<Coupon | null>;
  updateCoupon: (id: string, data: UpdateCouponPayload) => Promise<Coupon | null>;
  toggleCouponStatus: (id: string) => Promise<Coupon | null>;
  deleteCoupon: (id: string) => Promise<boolean>;
  clearError: () => void;
  invalidate: () => void;
}

export const useCouponStore = create<CouponState>((set, get) => ({
  coupons: [],
  isLoading: false,
  isSaving: false,
  error: null,
  isCached: false,

  fetchCoupons: async (forceRefresh = false) => {
    const state = get();
    if (state.isCached && state.coupons.length > 0 && !forceRefresh) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await couponApi.getAll();
      if (response.success && response.data) {
        set({ coupons: response.data, isLoading: false, isCached: true });
      } else {
        set({
          error: response.message || "Failed to fetch coupons",
          isLoading: false,
        });
      }
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to fetch coupons");
      set({ error: message, isLoading: false });
    }
  },

  createCoupon: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await couponApi.create(data);
      if (response.success && response.data) {
        const created = response.data;
        set((state) => ({
          coupons: [created, ...state.coupons],
          isSaving: false,
        }));
        return created;
      }
      set({
        error: response.message || "Failed to create coupon",
        isSaving: false,
      });
      return null;
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to create coupon");
      set({ error: message, isSaving: false });
      return null;
    }
  },

  updateCoupon: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await couponApi.update(id, data);
      if (response.success && response.data) {
        const updated = response.data;
        set((state) => ({
          coupons: state.coupons.map((c) => (c.id === id ? updated : c)),
          isSaving: false,
        }));
        return updated;
      }
      set({
        error: response.message || "Failed to update coupon",
        isSaving: false,
      });
      return null;
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to update coupon");
      set({ error: message, isSaving: false });
      return null;
    }
  },

  toggleCouponStatus: async (id) => {
    set({ isSaving: true, error: null });
    try {
      const response = await couponApi.toggleStatus(id);
      if (response.success && response.data) {
        const updated = response.data;
        set((state) => ({
          coupons: state.coupons.map((c) => (c.id === id ? updated : c)),
          isSaving: false,
        }));
        return updated;
      }
      set({
        error: response.message || "Failed to toggle coupon status",
        isSaving: false,
      });
      return null;
    } catch (error) {
      const message = extractErrorMessage(
        error,
        "Failed to toggle coupon status",
      );
      set({ error: message, isSaving: false });
      return null;
    }
  },

  deleteCoupon: async (id) => {
    set({ isSaving: true, error: null });
    try {
      const response = await couponApi.delete(id);
      if (response.success) {
        set((state) => ({
          coupons: state.coupons.filter((c) => c.id !== id),
          isSaving: false,
        }));
        return true;
      }
      set({
        error: response.message || "Failed to delete coupon",
        isSaving: false,
      });
      return false;
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to delete coupon");
      set({ error: message, isSaving: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  invalidate: () => set({ isCached: false }),
}));
