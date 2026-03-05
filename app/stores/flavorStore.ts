import { create } from "zustand";
import {
  flavorApi,
  type Flavor,
  type CreateFlavorWithVariantImagesRequest,
} from "@/lib/services/flavor.service";

interface FlavorState {
  flavors: Flavor[];
  isLoading: boolean;
  error: string | null;
  fetchFlavors: (
    page?: number,
    limit?: number,
    search?: string,
  ) => Promise<void>;
  addFlavor: (
    data: Omit<Flavor, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Flavor>;
  addFlavorWithVariantImages: (
    data: CreateFlavorWithVariantImagesRequest,
  ) => Promise<Flavor>;
  updateFlavor: (
    id: string,
    data: Partial<Omit<Flavor, "id" | "createdAt" | "updatedAt">>,
  ) => Promise<Flavor>;
  deleteFlavor: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useFlavorStore = create<FlavorState>((set) => ({
  flavors: [],
  isLoading: false,
  error: null,

  fetchFlavors: async (page = 1, limit = 10, search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await flavorApi.getAll(page, limit, search);
      if (response.success && response.data) {
        set({ flavors: response.data.items, isLoading: false });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch flavors";
      set({ error: errorMsg, isLoading: false });
    }
  },

  addFlavor: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await flavorApi.create(data);
      if (response.success && response.data) {
        set((state) => ({
          flavors: [...state.flavors, response.data as Flavor],
          isLoading: false,
        }));
        return response.data;
      }
      throw new Error(response.message || "Failed to create flavor");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create flavor";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  addFlavorWithVariantImages: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await flavorApi.createWithVariantImages(data);
      if (response.success && response.data) {
        set((state) => ({
          flavors: [...state.flavors, response.data as Flavor],
          isLoading: false,
        }));
        return response.data;
      }
      throw new Error(
        response.message || "Failed to create flavor with variant images",
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to create flavor with variant images";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  updateFlavor: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await flavorApi.update(id, data);
      if (response.success && response.data) {
        set((state) => ({
          flavors: state.flavors.map((f) =>
            f.id === id ? (response.data as Flavor) : f,
          ),
          isLoading: false,
        }));
        return response.data;
      }
      throw new Error(response.message || "Failed to update flavor");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update flavor";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  deleteFlavor: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await flavorApi.delete(id);
      if (response.success) {
        set((state) => ({
          flavors: state.flavors.filter((f) => f.id !== id),
          isLoading: false,
        }));
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete flavor";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
