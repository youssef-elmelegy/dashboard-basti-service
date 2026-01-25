/**
 * Bakery Store (Zustand)
 *
 * This store manages bakery data with API integration.
 * It handles fetching, caching, and mutations for bakeries.
 *
 * Features:
 * - Centralized API calls through bakeryApi service
 * - Loading and error state management
 * - Automatic caching with manual refresh
 * - Type-safe operations
 */

import { create } from "zustand";
import { bakeryApi, type Bakery } from "@/lib/services/bakery.service";

interface BakeryState {
  // Data
  bakeries: Bakery[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBakeries: () => Promise<void>;
  addBakery: (bakeryData: {
    name: string;
    locationDescription: string;
    regionId: string;
    capacity: number;
    bakeryTypes: string[];
  }) => Promise<void>;
  updateBakery: (
    id: string,
    bakeryData: {
      name?: string;
      locationDescription?: string;
      regionId?: string;
      capacity?: number;
      bakeryTypes?: string[];
    }
  ) => Promise<void>;
  deleteBakery: (id: string) => Promise<void>;
  clearError: () => void;
  resetBakeries: () => void;
}

export const useBakeryStore = create<BakeryState>((set) => ({
  // Initial state
  bakeries: [],
  isLoading: false,
  error: null,

  // Fetch all bakeries from API
  fetchBakeries: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await bakeryApi.getAll();

      if (response.success && response.data) {
        set({
          bakeries: response.data,
          isLoading: false,
        });
      } else {
        throw new Error(response.message || "Failed to fetch bakeries");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch bakeries";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Add new bakery
  addBakery: async (bakeryData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bakeryApi.create({
        name: bakeryData.name,
        locationDescription: bakeryData.locationDescription,
        regionId: bakeryData.regionId,
        capacity: bakeryData.capacity,
        bakeryTypes: bakeryData.bakeryTypes as (
          | "basket_cakes"
          | "medium_cakes"
          | "small_cakes"
          | "large_cakes"
          | "custom"
        )[],
      });

      if (response.success && response.data) {
        set((state) => ({
          bakeries: [...state.bakeries, response.data as Bakery],
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to create bakery");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create bakery";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Update existing bakery
  updateBakery: async (id, bakeryData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bakeryApi.update(id, {
        name: bakeryData.name,
        locationDescription: bakeryData.locationDescription,
        regionId: bakeryData.regionId,
        capacity: bakeryData.capacity,
        bakeryTypes: bakeryData.bakeryTypes as (
          | "basket_cakes"
          | "medium_cakes"
          | "small_cakes"
          | "large_cakes"
          | "custom"
        )[],
      });

      if (response.success && response.data) {
        set((state) => ({
          bakeries: state.bakeries.map((b) =>
            b.id === id ? (response.data as Bakery) : b
          ),
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to update bakery");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update bakery";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Delete bakery
  deleteBakery: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bakeryApi.delete(id);

      if (response.success) {
        set((state) => ({
          bakeries: state.bakeries.filter((b) => b.id !== id),
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to delete bakery");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete bakery";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Clear error message
  clearError: () => {
    set({ error: null });
  },

  // Reset to initial state
  resetBakeries: () => {
    set({
      bakeries: [],
      isLoading: false,
      error: null,
    });
  },
}));
