/**
 * Chef Store (Zustand)
 *
 * This store manages chef data globally with caching.
 *
 * Features:
 * - Single API call, cached across all pages
 * - Ready for real API integration
 * - Works with bakery store for filtering
 *
 * When real API is ready:
 * 1. Replace mock data with fetch('/api/chefs')
 * 2. Add loading/error states
 * 3. Implement cache invalidation strategy
 */

import { create } from "zustand";
import { CHEFS_DATA, type Chef } from "@/data/chefs";

interface ChefState {
  // Data
  chefs: Chef[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchChefs: () => Promise<void>;
  addChef: (chef: Chef) => void;
  updateChef: (id: string, chef: Partial<Chef>) => void;
  deleteChef: (id: string) => void;
  resetChefs: () => void;
}

export const useChefStore = create<ChefState>((set) => ({
  // Initial state
  chefs: CHEFS_DATA,
  isLoading: false,
  error: null,

  // Fetch from API (when ready)
  fetchChefs: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API when ready
      // const response = await fetch('/api/chefs');
      // const data = await response.json();

      const data = CHEFS_DATA; // Using mock data for now

      set({
        chefs: data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch chefs";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Add new chef
  addChef: (chef: Chef) => {
    set((state) => ({
      chefs: [...state.chefs, chef],
    }));
  },

  // Update existing chef
  updateChef: (id: string, updates: Partial<Chef>) => {
    set((state) => ({
      chefs: state.chefs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  // Delete chef
  deleteChef: (id: string) => {
    set((state) => ({
      chefs: state.chefs.filter((c) => c.id !== id),
    }));
  },

  // Reset to initial state
  resetChefs: () => {
    set({
      chefs: CHEFS_DATA,
      isLoading: false,
      error: null,
    });
  },
}));
