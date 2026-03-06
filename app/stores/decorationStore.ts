import { create } from "zustand";
import {
  decorationApi,
  type Decoration,
} from "@/lib/services/decoration.service";
import { apiClient } from "@/lib/api-client";

interface DecorationVariantImage {
  shapeId: string;
  sideViewUrl: string;
  frontViewUrl: string;
  topViewUrl: string;
}

interface AddDecorationWithVariantImagesData {
  title: string;
  description: string;
  decorationUrl: string;
  tagId?: string;
  variantImages: DecorationVariantImage[];
}

interface DecorationState {
  decorations: Decoration[];
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
  fetchDecorations: (
    page?: number,
    limit?: number,
    search?: string,
    forceRefresh?: boolean,
  ) => Promise<void>;
  loadMoreDecorations: (search?: string) => Promise<void>;
  addDecoration: (
    data: Omit<Decoration, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Decoration>;
  addDecorationWithVariantImages: (
    data: AddDecorationWithVariantImagesData,
  ) => Promise<Decoration>;
  updateDecoration: (
    id: string,
    data: Partial<Omit<Decoration, "id" | "createdAt" | "updatedAt">>,
  ) => Promise<Decoration>;
  deleteDecoration: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDecorationStore = create<DecorationState>((set, get) => ({
  decorations: [],
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

  fetchDecorations: async (
    page = 1,
    limit = 10,
    search?: string,
    forceRefresh = false,
  ) => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state.isCached && state.decorations.length > 0 && !forceRefresh) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await decorationApi.getAll(page, limit, search);
      if (response.success && response.data) {
        set({
          decorations: response.data.items,
          pagination: response.data.pagination,
          isLoading: false,
          isCached: true,
        });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch decorations";
      set({ error: errorMsg, isLoading: false });
    }
  },

  loadMoreDecorations: async (search?: string) => {
    const state = get();
    const nextPage = state.pagination.page + 1;

    // Don't load more if we're already at the last page
    if (nextPage > state.pagination.totalPages) {
      return;
    }

    set({ isLoadingMore: true, error: null });
    try {
      const response = await decorationApi.getAll(
        nextPage,
        state.pagination.limit,
        search,
      );
      if (response.success && response.data) {
        set({
          decorations: [...state.decorations, ...response.data.items],
          pagination: response.data.pagination,
          isLoadingMore: false,
        });
      } else {
        set({
          error: "Failed to load more decorations",
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

  addDecoration: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await decorationApi.create(data);
      if (response.success && response.data) {
        set((state) => ({
          decorations: [...state.decorations, response.data as Decoration],
          isLoading: false,
        }));
        return response.data;
      }
      throw new Error(response.message || "Failed to create decoration");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create decoration";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  addDecorationWithVariantImages: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<Decoration>(
        "/custom-cakes/decorations/with-variant-images",
        data,
      );
      if (response.data) {
        set((state) => ({
          decorations: [...state.decorations, response.data as Decoration],
          isLoading: false,
        }));
        return response.data;
      }
      throw new Error("Failed to create decoration with variant images");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create decoration";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  updateDecoration: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await decorationApi.update(id, data);
      if (response.success && response.data) {
        set((state) => ({
          decorations: state.decorations.map((d) =>
            d.id === id ? (response.data as Decoration) : d,
          ),
          isLoading: false,
        }));
        return response.data;
      }
      throw new Error(response.message || "Failed to update decoration");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update decoration";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  deleteDecoration: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await decorationApi.delete(id);
      if (response.success) {
        set((state) => ({
          decorations: state.decorations.filter((d) => d.id !== id),
          isLoading: false,
        }));
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete decoration";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
