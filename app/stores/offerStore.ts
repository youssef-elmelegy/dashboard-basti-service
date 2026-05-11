import { create } from "zustand";
import {
  offerApi,
  type Offer,
  type CreateOfferPayload,
  type UpdateOfferPayload,
  type ToggleItemOfferPayload,
} from "@/lib/services/offer.service";

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

interface OfferState {
  offers: Offer[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isCached: boolean;

  fetchOffers: (forceRefresh?: boolean) => Promise<void>;
  createOffer: (data: CreateOfferPayload) => Promise<Offer | null>;
  updateOffer: (id: string, data: UpdateOfferPayload) => Promise<Offer | null>;
  toggleOfferStatus: (id: string) => Promise<Offer | null>;
  deleteOffer: (id: string) => Promise<boolean>;
  toggleItemOffer: (payload: ToggleItemOfferPayload) => Promise<boolean>;
  clearError: () => void;
}

export const useOfferStore = create<OfferState>((set, get) => ({
  offers: [],
  isLoading: false,
  isSaving: false,
  error: null,
  isCached: false,

  fetchOffers: async (forceRefresh = false) => {
    const state = get();
    if (state.isCached && state.offers.length > 0 && !forceRefresh) return;

    set({ isLoading: true, error: null });
    try {
      const response = await offerApi.getAll();
      if (response.success && response.data) {
        set({ offers: response.data, isLoading: false, isCached: true });
      } else {
        set({ error: response.message || "Failed to fetch offers", isLoading: false });
      }
    } catch (error) {
      set({ error: extractErrorMessage(error, "Failed to fetch offers"), isLoading: false });
    }
  },

  createOffer: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await offerApi.create(data);
      if (response.success && response.data) {
        set((state) => ({ offers: [response.data!, ...state.offers], isSaving: false }));
        return response.data;
      }
      set({ error: response.message || "Failed to create offer", isSaving: false });
      return null;
    } catch (error) {
      set({ error: extractErrorMessage(error, "Failed to create offer"), isSaving: false });
      return null;
    }
  },

  updateOffer: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await offerApi.update(id, data);
      if (response.success && response.data) {
        const updated = response.data;
        set((state) => ({
          offers: state.offers.map((o) => (o.id === id ? updated : o)),
          isSaving: false,
        }));
        return updated;
      }
      set({ error: response.message || "Failed to update offer", isSaving: false });
      return null;
    } catch (error) {
      set({ error: extractErrorMessage(error, "Failed to update offer"), isSaving: false });
      return null;
    }
  },

  toggleOfferStatus: async (id) => {
    set({ isSaving: true, error: null });
    try {
      const response = await offerApi.toggleStatus(id);
      if (response.success && response.data) {
        const updated = response.data;
        set((state) => ({
          offers: state.offers.map((o) => (o.id === id ? updated : o)),
          isSaving: false,
        }));
        return updated;
      }
      set({ error: response.message || "Failed to toggle offer status", isSaving: false });
      return null;
    } catch (error) {
      set({ error: extractErrorMessage(error, "Failed to toggle offer status"), isSaving: false });
      return null;
    }
  },

  deleteOffer: async (id) => {
    set({ isSaving: true, error: null });
    try {
      const response = await offerApi.delete(id);
      if (response.success) {
        set((state) => ({ offers: state.offers.filter((o) => o.id !== id), isSaving: false }));
        return true;
      }
      set({ error: response.message || "Failed to delete offer", isSaving: false });
      return false;
    } catch (error) {
      set({ error: extractErrorMessage(error, "Failed to delete offer"), isSaving: false });
      return false;
    }
  },

  toggleItemOffer: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      const response = await offerApi.toggleItem(payload);
      set({ isSaving: false });
      if (response.success) {
        await get().fetchOffers(true);
      }
      return response.success;
    } catch (error) {
      set({ error: extractErrorMessage(error, "Failed to toggle offer on item"), isSaving: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
