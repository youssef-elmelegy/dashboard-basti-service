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
import { bakeryApi, type Bakery, type BakeryType } from "@/lib/services/bakery.service";

interface BakeryState {
  // Data
  bakeries: Bakery[];
  currentBakery: Bakery | null;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  // Actions
  fetchBakeries: () => Promise<void>;
  getBakeryById: (id: string) => Promise<Bakery | null>;
  addBakery: (bakeryData: {
    name: string;
    locationDescription: string;
    regionId: string;
    capacity: number;
    bakeryTypes: BakeryType[];
  }) => Promise<void>;
  updateBakery: (
    id: string,
    bakeryData: {
      name?: string;
      locationDescription?: string;
      regionId?: string;
      capacity?: number;
      bakeryTypes?: BakeryType[];
    },
  ) => Promise<void>;
  deleteBakery: (id: string) => Promise<void>;
  clearError: () => void;
  resetBakeries: () => void;
}

const BAKERY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useBakeryStore = create<BakeryState>((set, get) => ({
  // Initial state
  bakeries: [],
  currentBakery: null,
  isLoading: false,
  error: null,
  lastFetchTime: null,

  // Fetch all bakeries from API with caching
  fetchBakeries: async () => {
    const state = get();
    const now = Date.now();

    // Return cached data if it's still fresh
    if (
      state.bakeries.length > 0 &&
      state.lastFetchTime &&
      now - state.lastFetchTime < BAKERY_CACHE_DURATION
    ) {
      console.log("BakeryStore: Using cached bakeries");
      return;
    }

    console.log("BakeryStore: Fetching bakeries...");
    set({ isLoading: true, error: null });
    try {
      const response = await bakeryApi.getAll();
      console.log("BakeryStore: API response:", response);

      if (response.success && response.data) {
        // Extract items from paginated response
        const bakeriesData = Array.isArray(response.data)
          ? response.data
          : "items" in (response.data as Record<string, unknown>)
            ? (response.data as Record<string, unknown>).items
            : [];

        console.log(
          "BakeryStore: Bakeries fetched successfully:",
          bakeriesData,
        );
        set({
          bakeries: bakeriesData as Bakery[],
          isLoading: false,
          lastFetchTime: now,
        });
      } else {
        const error = response.message || "Failed to fetch bakeries";
        console.error("BakeryStore: API returned error:", error);
        throw new Error(error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch bakeries";
      console.error("BakeryStore: Fetch failed:", errorMessage, error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Get single bakery by ID
  getBakeryById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await bakeryApi.getOne(id);

      if (response.success && response.data) {
        set({
          currentBakery: response.data,
          isLoading: false,
        });
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch bakery");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch bakery";
      set({ error: errorMessage, isLoading: false });
      return null;
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
        bakeryTypes: bakeryData.bakeryTypes,
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
        bakeryTypes: bakeryData.bakeryTypes,
      });

      if (response.success && response.data) {
        set((state) => ({
          bakeries: state.bakeries.map((b) =>
            b.id === id ? (response.data as Bakery) : b,
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
