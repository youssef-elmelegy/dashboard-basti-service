import { create } from "zustand";
import {
  flavorApi,
  type Flavor,
  type CreateFlavorRequest,
  type UpdateFlavorRequest,
  type CreateFlavorWithVariantImagesRequest,
  type FlavorConflictData,
} from "@/lib/services/flavor.service";

interface FlavorState {
  flavors: Flavor[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  isCached: boolean;
  flavorConflict: (FlavorConflictData & { flavorId: string }) | null;
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  fetchFlavors: (
    page?: number,
    limit?: number,
    search?: string,
    forceRefresh?: boolean,
  ) => Promise<void>;
  loadMoreFlavors: (search?: string) => Promise<void>;
  addFlavor: (data: CreateFlavorRequest) => Promise<Flavor>;
  addFlavorWithVariantImages: (
    data: CreateFlavorWithVariantImagesRequest,
  ) => Promise<Flavor>;
  updateFlavor: (id: string, data: UpdateFlavorRequest) => Promise<Flavor>;
  deleteFlavor: (id: string) => Promise<void>;
  forceDeleteFlavor: (id: string) => Promise<void>;
  changeFlavorOrder: (id: string, newOrder: number) => Promise<void>;
  clearConflict: () => void;
  clearError: () => void;
}

export const useFlavorStore = create<FlavorState>((set, get) => ({
  flavors: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  isCached: false,
  flavorConflict: null,
  pagination: {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  },

  fetchFlavors: async (
    page = 1,
    limit = 10,
    search?: string,
    forceRefresh = false,
  ) => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state.isCached && state.flavors.length > 0 && !forceRefresh) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await flavorApi.getAll(page, limit, search);
      if (response.success && response.data) {
        set({
          flavors: response.data.items,
          pagination: response.data.pagination,
          isLoading: false,
          isCached: true,
        });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch flavors";
      set({ error: errorMsg, isLoading: false });
    }
  },

  loadMoreFlavors: async (search?: string) => {
    const state = get();
    const nextPage = state.pagination.page + 1;

    // Don't load more if we're already at the last page
    if (nextPage > state.pagination.totalPages) {
      return;
    }

    set({ isLoadingMore: true, error: null });
    try {
      const response = await flavorApi.getAll(
        nextPage,
        state.pagination.limit,
        search,
      );
      if (response.success && response.data) {
        set({
          flavors: [...state.flavors, ...response.data.items],
          pagination: response.data.pagination,
          isLoadingMore: false,
        });
      } else {
        set({
          error: "Failed to load more flavors",
          isLoadingMore: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        isLoadingMore: false,
      });
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
      throw new Error(response.message || "customCakes.failedToUpdateFlavor");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "customCakes.failedToUpdateFlavor";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  deleteFlavor: async (id) => {
    set({ isLoading: true, error: null, flavorConflict: null });
    try {
      const response = await flavorApi.delete(id);
      if (response.success) {
        set((state) => ({
          flavors: state.flavors.filter((f) => f.id !== id),
          isLoading: false,
        }));
      }
    } catch (error) {
      // 409 Conflict — flavor has related predesigned cake configs
      const apiErr = error as {
        code?: number;
        data?: {
          relatedConfigsCount?: number;
          affectedPredesignedCakesCount?: number;
          affectedPredesignedCakeIds?: string[];
        };
        message?: string;
      };
      if (
        apiErr.code === 409 &&
        apiErr.data?.relatedConfigsCount !== undefined
      ) {
        set({
          isLoading: false,
          flavorConflict: {
            flavorId: id,
            relatedConfigsCount: apiErr.data.relatedConfigsCount ?? 0,
            affectedPredesignedCakesCount:
              apiErr.data.affectedPredesignedCakesCount ?? 0,
            affectedPredesignedCakeIds:
              apiErr.data.affectedPredesignedCakeIds ?? [],
          },
        });
      } else {
        const errorMsg = apiErr.message ?? "Failed to delete flavor";
        set({ error: errorMsg, isLoading: false });
        throw error;
      }
    }
  },

  forceDeleteFlavor: async (id) => {
    set({ isLoading: true, error: null, flavorConflict: null });
    try {
      await flavorApi.forceDelete(id);
      set((state) => ({
        flavors: state.flavors.filter((f) => f.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to force-delete flavor";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  changeFlavorOrder: async (id, newOrder) => {
    // Optimistic update: apply new order locally immediately, call API, rollback on error
    set({ error: null });

    const prevFlavors = get().flavors;

    const currentOrdered = [...prevFlavors].sort((a, b) => a.order - b.order);
    const movingIndex = currentOrdered.findIndex((f) => f.id === id);
    if (movingIndex === -1) return;

    const movingFlavor = currentOrdered[movingIndex];
    currentOrdered.splice(movingIndex, 1);
    const targetIndex = Math.max(
      0,
      Math.min(newOrder - 1, currentOrdered.length),
    );
    currentOrdered.splice(targetIndex, 0, movingFlavor);

    const optimisticFlavors = currentOrdered.map((f, idx) => ({
      ...f,
      order: idx + 1,
    }));
    set({ flavors: optimisticFlavors });

    try {
      const response = await flavorApi.changeOrder(id, newOrder);
      if (response.success) {
        // Success: keep optimistic state and clear any error
        set({ error: null });
      } else {
        // Rollback on failure
        set({
          flavors: prevFlavors,
          error: response.message || "Failed to change flavor order",
        });
        throw new Error(response.message || "Failed to change flavor order");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to change flavor order";
      set({ flavors: prevFlavors, error: errorMsg });
      throw error;
    }
  },

  clearConflict: () => set({ flavorConflict: null }),

  clearError: () => set({ error: null }),
}));
