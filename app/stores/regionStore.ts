/**
 * Region Store (Zustand)
 *
 * This store manages region data globally with caching.
 *
 * Features:
 * - Single API call, cached across all pages
 * - Ready for real API integration
 * - No provider needed (optional)
 *
 * When real API is ready:
 * 1. Replace REGIONS_DATA with fetch('/api/regions')
 * 2. Add loading/error states
 * 3. Implement cache invalidation strategy
 */

import { create } from "zustand";
import { REGIONS_DATA, type Region } from "@/data/regions";

interface RegionState {
  // Data
  regions: Region[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRegions: () => Promise<void>;
  addRegion: (region: Region) => void;
  updateRegion: (id: string, region: Partial<Region>) => void;
  deleteRegion: (id: string) => void;
  resetRegions: () => void;
}

export const useRegionStore = create<RegionState>((set) => ({
  // Initial state
  regions: REGIONS_DATA,
  isLoading: false,
  error: null,

  // Fetch from API (when ready)
  fetchRegions: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API when ready
      // const response = await fetch('/api/regions');
      // const data = await response.json();

      const data = REGIONS_DATA; // Using mock data for now

      set({
        regions: data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch regions";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Add new region
  addRegion: (region: Region) => {
    set((state) => ({
      regions: [...state.regions, region],
    }));
  },

  // Update existing region
  updateRegion: (id: string, updates: Partial<Region>) => {
    set((state) => ({
      regions: state.regions.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  },

  // Delete region
  deleteRegion: (id: string) => {
    set((state) => ({
      regions: state.regions.filter((r) => r.id !== id),
    }));
  },

  // Reset to initial state
  resetRegions: () => {
    set({
      regions: REGIONS_DATA,
      isLoading: false,
      error: null,
    });
  },
}));
