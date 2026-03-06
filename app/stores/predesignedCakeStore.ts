import { create } from "zustand";
import {
  predesignedCakeService,
  type PredesignedCake,
} from "@/lib/services/predesigned-cake.service";
import type {
  UpdatePredesignedCakeDto,
  CreatePredesignedCakeDto,
} from "@/lib/services/predesigned-cake.service";

interface PredesignedCakeState {
  predesignedCakes: PredesignedCake[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  isCached: boolean;
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };

  // Actions
  fetchPredesignedCakes: (
    page?: number,
    limit?: number,
    sortBy?: string,
    order?: string,
    regionId?: string,
    search?: string,
    forceRefresh?: boolean,
  ) => Promise<void>;
  loadMorePredesignedCakes: (
    sortBy?: string,
    order?: string,
    regionId?: string,
    search?: string,
  ) => Promise<void>;
  createPredesignedCake: (
    data: CreatePredesignedCakeDto,
  ) => Promise<PredesignedCake | null>;
  updatePredesignedCake: (
    id: string,
    data: UpdatePredesignedCakeDto,
  ) => Promise<PredesignedCake | null>;
  deletePredesignedCake: (id: string) => Promise<boolean>;
  togglePredesignedCakeActive: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const usePredesignedCakeStore = create<PredesignedCakeState>(
  (set, get) => ({
    predesignedCakes: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    isCached: false,
    pagination: {
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 10,
    },

    fetchPredesignedCakes: async (
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "DESC",
      regionId,
      search,
      forceRefresh = false,
    ) => {
      const state = get();

      // Return cached data if available and not forcing refresh
      if (
        state.isCached &&
        state.predesignedCakes.length > 0 &&
        !forceRefresh
      ) {
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const response = await predesignedCakeService.getAll(
          page,
          limit,
          sortBy,
          order,
          regionId,
          search,
        );
        if (response.success && response.data) {
          set({
            predesignedCakes: response.data.items,
            pagination: response.data.pagination,
            isLoading: false,
            isCached: true,
          });
        } else {
          set({
            error: response.message || "Failed to fetch predesigned cakes",
            isLoading: false,
          });
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "An error occurred",
          isLoading: false,
        });
      }
    },

    loadMorePredesignedCakes: async (
      sortBy = "createdAt",
      order = "DESC",
      regionId,
      search,
    ) => {
      const state = get();
      const nextPage = state.pagination.page + 1;

      // Don't load more if we're already at the last page
      if (nextPage > state.pagination.totalPages) {
        return;
      }

      set({ isLoadingMore: true, error: null });
      try {
        const response = await predesignedCakeService.getAll(
          nextPage,
          state.pagination.limit,
          sortBy,
          order,
          regionId,
          search,
        );
        if (response.success && response.data) {
          set({
            predesignedCakes: [
              ...state.predesignedCakes,
              ...response.data.items,
            ],
            pagination: response.data.pagination,
            isLoadingMore: false,
          });
        } else {
          set({
            error: response.message || "Failed to load more predesigned cakes",
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

    createPredesignedCake: async (data: CreatePredesignedCakeDto) => {
      set({ isLoading: true, error: null });
      try {
        const response = await predesignedCakeService.create(data);
        if (response.success && response.data) {
          set((state) => ({
            predesignedCakes: [response.data!, ...state.predesignedCakes],
            isLoading: false,
          }));
          return response.data;
        } else {
          set({
            error: response.message || "Failed to create predesigned cake",
            isLoading: false,
          });
          return null;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "An error occurred";
        set({ error: errorMsg, isLoading: false });
        return null;
      }
    },

    updatePredesignedCake: async (
      id: string,
      data: UpdatePredesignedCakeDto,
    ) => {
      set({ isLoading: true, error: null });
      try {
        const response = await predesignedCakeService.update(id, data);
        if (response.success && response.data) {
          set((state) => ({
            predesignedCakes: state.predesignedCakes.map((cake) =>
              cake.id === id ? response.data! : cake,
            ),
            isLoading: false,
          }));
          return response.data;
        } else {
          set({
            error: response.message || "Failed to update predesigned cake",
            isLoading: false,
          });
          return null;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "An error occurred";
        set({ error: errorMsg, isLoading: false });
        return null;
      }
    },

    deletePredesignedCake: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await predesignedCakeService.delete(id);
        if (response.success) {
          set((state) => ({
            predesignedCakes: state.predesignedCakes.filter(
              (cake) => cake.id !== id,
            ),
            isLoading: false,
          }));
          return true;
        } else {
          set({
            error: response.message || "Failed to delete predesigned cake",
            isLoading: false,
          });
          return false;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "An error occurred";
        set({ error: errorMsg, isLoading: false });
        return false;
      }
    },

    togglePredesignedCakeActive: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await predesignedCakeService.toggleActive(id);
        if (response.success && response.data) {
          set((state) => ({
            predesignedCakes: state.predesignedCakes.map((cake) =>
              cake.id === id ? { ...cake, ...response.data! } : cake,
            ),
            isLoading: false,
          }));
          return true;
        } else {
          set({
            error:
              response.message || "Failed to toggle predesigned cake status",
            isLoading: false,
          });
          return false;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "An error occurred";
        set({ error: errorMsg, isLoading: false });
        return false;
      }
    },

    clearError: () => set({ error: null }),
  }),
);
