import { create } from "zustand";
import { sweetService, type Sweet } from "@/lib/services/sweet.service";

type SweetInput = {
  name: string;
  description: string;
  images: string[];
  sizes: string[];
  isActive: boolean;
  tagId?: string;
  tagName?: string;
};

interface SweetStore {
  sweets: Sweet[];
  isLoading: boolean;
  error: string | null;
  isCached: boolean;
  fetchSweets: (forceRefresh?: boolean) => Promise<void>;
  addSweet: (sweet: SweetInput) => Promise<void>;
  updateSweet: (id: string, sweet: SweetInput) => Promise<void>;
  deleteSweet: (id: string) => Promise<void>;
  toggleSweetStatus: (id: string) => Promise<void>;
}

export const useSweetStore = create<SweetStore>((set, get) => ({
  sweets: [],
  isLoading: false,
  error: null,
  isCached: false,

  fetchSweets: async (forceRefresh = false) => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state.isCached && state.sweets.length > 0 && !forceRefresh) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await sweetService.getAll();
      if (response.success && response.data) {
        set({ sweets: response.data.items, isCached: true });
      } else {
        set({ error: "Failed to fetch sweets" });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch sweets",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addSweet: async (sweet) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sweetService.create(sweet);
      if (response.success && response.data) {
        set({ sweets: [...get().sweets, response.data] });
      } else {
        set({ error: "Failed to create sweet" });
      }
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Failed to create sweet");
    } finally {
      set({ isLoading: false });
    }
  },

  updateSweet: async (id, sweet) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sweetService.update(id, sweet);
      if (response.success && response.data) {
        const updatedSweet = response.data;
        set({
          sweets: get().sweets.map((s) => (s.id === id ? updatedSweet : s)),
        });
      } else {
        set({ error: "Failed to update sweet" });
      }
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Failed to update sweet");
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSweet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sweetService.delete(id);
      if (response.success) {
        set({ sweets: get().sweets.filter((s) => s.id !== id) });
      } else {
        set({ error: "Failed to delete sweet" });
      }
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Failed to delete sweet");
    } finally {
      set({ isLoading: false });
    }
  },

  toggleSweetStatus: async (id) => {
    set({ error: null });
    try {
      const response = await sweetService.toggleStatus(id);
      if (response.success && response.data) {
        const updatedSweet = response.data;
        set({
          sweets: get().sweets.map((s) => (s.id === id ? updatedSweet : s)),
        });
      } else {
        set({ error: "Failed to toggle sweet status" });
      }
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Failed to toggle sweet status");
    }
  },
}));
