/**
 * Slider Image Store (Zustand)
 *
 * This store manages slider image data with API integration.
 * It handles fetching, caching, and mutations for slider images.
 */

import { create } from "zustand";
import {
  sliderImageApi,
  type SliderImage,
  type SliderImageItem,
} from "@/lib/services/slider-image.service";

interface SliderImageState {
  // Data
  sliderImages: SliderImage[];
  isLoading: boolean;
  error: string | null;
  isCached: boolean;

  // Actions
  fetchSliderImages: (forceRefresh?: boolean) => Promise<void>;
  updateSliderImages: (items: SliderImageItem[]) => Promise<void>;
  changeSliderImageOrder: (id: string, newOrder: number) => Promise<void>;
  deleteSliderImage: (id: string) => Promise<void>;
  clearError: () => void;
  invalidate: () => void;
}

export const useSliderImageStore = create<SliderImageState>((set, get) => ({
  // Initial state
  sliderImages: [],
  isLoading: false,
  error: null,
  isCached: false,

  // Fetch all slider images from API
  fetchSliderImages: async (forceRefresh = false) => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state.isCached && state.sliderImages.length > 0 && !forceRefresh) {
      return;
    }

    console.log("SliderImageStore: Fetching slider images...");
    set({ isLoading: true, error: null });
    try {
      const response = await sliderImageApi.getAll();
      console.log("SliderImageStore: API response:", response);

      if (response.success && response.data) {
        const images = Array.isArray(response.data) ? response.data : [];
        console.log("SliderImageStore: Images fetched successfully:", images);
        set({
          sliderImages: images,
          isLoading: false,
          isCached: true,
        });
      } else {
        const error = response.message || "Failed to fetch slider images";
        console.error("SliderImageStore: API returned error:", error);
        throw new Error(error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch slider images";
      console.error("SliderImageStore: Error:", errorMessage);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Update slider images (bulk operation)
  updateSliderImages: async (items) => {
    console.log("SliderImageStore: Updating slider images...");
    set({ isLoading: true, error: null });
    try {
      const response = await sliderImageApi.update(items);
      console.log("SliderImageStore: Update response:", response);

      if (response.success && response.data) {
        const images = Array.isArray(response.data) ? response.data : [];
        set({
          sliderImages: images,
          isLoading: false,
        });
      } else {
        const error = response.message || "Failed to update slider images";
        throw new Error(error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update slider images";
      console.error("SliderImageStore: Update error:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Move an image to a new 1-based position. Optimistic: the reordered list is
  // applied locally right away so the drag lands instantly, and rolled back to
  // the previous order if the request fails.
  changeSliderImageOrder: async (id, newOrder) => {
    set({ error: null });

    const prevImages = get().sliderImages;

    const reordered = [...prevImages].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    const movingIndex = reordered.findIndex((img) => img.id === id);
    if (movingIndex === -1) return;

    const [movingImage] = reordered.splice(movingIndex, 1);
    const targetIndex = Math.max(0, Math.min(newOrder - 1, reordered.length));
    reordered.splice(targetIndex, 0, movingImage);

    set({
      sliderImages: reordered.map((img, idx) => ({
        ...img,
        displayOrder: idx + 1,
      })),
    });

    try {
      const response = await sliderImageApi.changeOrder(id, newOrder);
      if (!response.success) {
        throw new Error(
          response.message || "Failed to change slider image order",
        );
      }
      // Prefer the server's authoritative ordering when it sends one back.
      if (Array.isArray(response.data)) {
        set({ sliderImages: response.data });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to change slider image order";
      console.error("SliderImageStore: Reorder error:", errorMessage);
      set({ sliderImages: prevImages, error: errorMessage });
      throw error;
    }
  },

  // Delete slider image by ID
  deleteSliderImage: async (id) => {
    console.log("SliderImageStore: Deleting slider image...");
    set({ isLoading: true, error: null });
    try {
      const response = await sliderImageApi.delete(id);
      console.log("SliderImageStore: Delete response:", response);

      if (response.success) {
        set((state) => ({
          sliderImages: state.sliderImages.filter((img) => img.id !== id),
          isLoading: false,
        }));
      } else {
        const error = response.message || "Failed to delete slider image";
        throw new Error(error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete slider image";
      console.error("SliderImageStore: Delete error:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Clear error message
  clearError: () => {
    set({ error: null });
  },

  // Invalidate cache so next fetch bypasses the cached-data check
  invalidate: () => set({ isCached: false }),
}));
