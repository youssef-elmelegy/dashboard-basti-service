/**
 * Region Store (Zustand)
 *
 * This store manages region data with API integration.
 * It handles fetching, caching, and mutations for regions.
 *
 * Features:
 * - Centralized API calls through regionApi service
 * - Loading and error state management
 * - Automatic caching with manual refresh
 * - Type-safe operations
 */

import { create } from "zustand";
import { regionApi } from "@/lib/services/region.service";
import type { Region } from "@/data/regions";

interface RegionState {
  // Data
  regions: Region[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRegions: () => Promise<void>;
  addRegion: (regionData: { name: string }) => Promise<void>;
  updateRegion: (id: string, regionData: { name: string }) => Promise<void>;
  deleteRegion: (id: string) => Promise<void>;
  clearError: () => void;
  resetRegions: () => void;
}

export const useRegionStore = create<RegionState>((set) => ({
  // Initial state
  regions: [],
  isLoading: false,
  error: null,

  // Fetch all regions from API
  fetchRegions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.getAll();

      if (response.success && response.data) {
        set({
          regions: response.data,
          isLoading: false,
        });
      } else {
        throw new Error(response.message || "Failed to fetch regions");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch regions";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Add new region
  addRegion: async (regionData: { name: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.create(regionData);

      if (response.success && response.data) {
        set((state) => ({
          regions: [...state.regions, response.data as Region],
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to create region");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create region";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Update existing region
  updateRegion: async (id: string, regionData: { name: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.update(id, regionData);

      if (response.success && response.data) {
        set((state) => ({
          regions: state.regions.map((r) =>
            r.id === id ? (response.data as Region) : r
          ),
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to update region");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update region";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Delete region
  deleteRegion: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.delete(id);

      if (response.success) {
        set((state) => ({
          regions: state.regions.filter((r) => r.id !== id),
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to delete region");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete region";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Clear error message
  clearError: () => {
    set({ error: null });
  },

  // Reset to initial state
  resetRegions: () => {
    set({
      regions: [],
      isLoading: false,
      error: null,
    });
  },
}));
