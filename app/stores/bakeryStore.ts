/**
 * Bakery Store (Zustand)
 *
 * This store manages bakery data globally with caching.
 *
 * Features:
 * - Single API call, cached across all pages
 * - Derived state (bakeryNames) automatically updates
 * - Ready for real API integration
 * - No provider needed (optional)
 *
 * When real API is ready:
 * 1. Replace BAKERIES_DATA with fetch('/api/bakeries')
 * 2. Add loading/error states
 * 3. Implement cache invalidation strategy
 */

import { create } from "zustand";
import { BAKERIES_DATA, type Bakery } from "@/data/bakeries";

interface BakeryState {
  // Data
  bakeries: Bakery[];
  isLoading: boolean;
  error: string | null;

  // Derived data (cached)
  bakeryNames: string[];

  // Actions
  fetchBakeries: () => Promise<void>;
  addBakery: (bakery: Bakery) => void;
  updateBakery: (id: string, bakery: Partial<Bakery>) => void;
  deleteBakery: (id: string) => void;
  resetBakeries: () => void;
}

export const useBakeryStore = create<BakeryState>((set) => ({
  // Initial state
  bakeries: BAKERIES_DATA,
  bakeryNames: BAKERIES_DATA.map((b) => b.name),
  isLoading: false,
  error: null,

  // Fetch from API (when ready)
  fetchBakeries: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API when ready
      // const response = await fetch('/api/bakeries');
      // const data = await response.json();

      const data = BAKERIES_DATA; // Using mock data for now

      set({
        bakeries: data,
        bakeryNames: data.map((b) => b.name),
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch bakeries";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Add new bakery
  addBakery: (bakery: Bakery) => {
    set((state) => ({
      bakeries: [...state.bakeries, bakery],
      bakeryNames: [...state.bakeryNames, bakery.name],
    }));
  },

  // Update existing bakery
  updateBakery: (id: string, updates: Partial<Bakery>) => {
    set((state) => {
      const updatedBakeries = state.bakeries.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      );
      return {
        bakeries: updatedBakeries,
        bakeryNames: updatedBakeries.map((b) => b.name),
      };
    });
  },

  // Delete bakery
  deleteBakery: (id: string) => {
    set((state) => {
      const updatedBakeries = state.bakeries.filter((b) => b.id !== id);
      return {
        bakeries: updatedBakeries,
        bakeryNames: updatedBakeries.map((b) => b.name),
      };
    });
  },

  // Reset to initial state
  resetBakeries: () => {
    set({
      bakeries: BAKERIES_DATA,
      bakeryNames: BAKERIES_DATA.map((b) => b.name),
      isLoading: false,
      error: null,
    });
  },
}));
