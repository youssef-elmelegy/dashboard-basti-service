/**
 * Featured Cake Store (Zustand)
 *
 * This store manages featured cake data with API integration.
 * It handles fetching, caching, and mutations for featured cakes.
 */

import { create } from "zustand";
import {
  featuredCakeApi,
  type FeaturedCake,
  type CreateFeaturedCakeRequest,
  type UpdateFeaturedCakeRequest,
} from "@/lib/services/featured-cake.service";
import {
  uploadImage,
  deleteImages,
  type CloudinaryUploadResult,
  type DeleteImageResult,
} from "@/lib/api/cake.api";

interface FeaturedCakeState {
  // Data
  featuredCakes: FeaturedCake[];
  currentFeaturedCake: FeaturedCake | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFeaturedCakes: (page?: number, limit?: number) => Promise<void>;
  getFeaturedCakeById: (id: string) => Promise<FeaturedCake | null>;
  addFeaturedCake: (
    cakeData: CreateFeaturedCakeRequest,
  ) => Promise<FeaturedCake>;
  updateFeaturedCake: (
    id: string,
    cakeData: UpdateFeaturedCakeRequest,
  ) => Promise<FeaturedCake>;
  deleteFeaturedCake: (id: string) => Promise<void>;
  toggleFeaturedCakeStatus: (id: string) => Promise<FeaturedCake>;
  uploadFeaturedCakeImage: (file: File) => Promise<CloudinaryUploadResult>;
  deleteFeaturedCakeImages: (urls: string[]) => Promise<DeleteImageResult>;
  clearError: () => void;
  resetFeaturedCakes: () => void;
}

export const useFeaturedCakeStore = create<FeaturedCakeState>((set) => ({
  // Initial state
  featuredCakes: [],
  currentFeaturedCake: null,
  pagination: null,
  isLoading: false,
  error: null,

  // Fetch all featured cakes from API
  fetchFeaturedCakes: async (page = 1, limit = 10) => {
    console.log(
      `FeaturedCakeStore: Fetching featured cakes (page: ${page}, limit: ${limit})...`,
    );
    set({ isLoading: true, error: null });
    try {
      const response = await featuredCakeApi.getAll({ page, limit });
      console.log("FeaturedCakeStore: API response:", response);

      if (response.success && response.data) {
        console.log(
          "FeaturedCakeStore: Featured cakes fetched successfully:",
          response.data,
        );
        set({
          featuredCakes: response.data.items,
          pagination: response.data.pagination,
          isLoading: false,
        });
      } else {
        const error = response.message || "Failed to fetch featured cakes";
        console.error("FeaturedCakeStore: API returned error:", error);
        throw new Error(error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch featured cakes";
      console.error("FeaturedCakeStore: Fetch failed:", errorMessage, error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Get single featured cake by ID
  getFeaturedCakeById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await featuredCakeApi.getOne(id);

      if (response.success && response.data) {
        set({
          currentFeaturedCake: response.data,
          isLoading: false,
        });
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch featured cake");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch featured cake";
      console.error(
        "FeaturedCakeStore: Get featured cake failed:",
        errorMessage,
      );
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Create new featured cake
  addFeaturedCake: async (cakeData: CreateFeaturedCakeRequest) => {
    console.log("FeaturedCakeStore: Creating featured cake...", cakeData);
    set({ isLoading: true, error: null });
    try {
      const response = await featuredCakeApi.create(cakeData);
      console.log("FeaturedCakeStore: Create response:", response);

      if (response.success && response.data) {
        console.log(
          "FeaturedCakeStore: Featured cake created successfully:",
          response.data,
        );
        set((state) => ({
          featuredCakes: [
            ...state.featuredCakes,
            response.data,
          ] as FeaturedCake[],
          isLoading: false,
        }));
        return response.data;
      } else {
        throw new Error(response.message || "Failed to create featured cake");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create featured cake";
      console.error("FeaturedCakeStore: Create failed:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Update featured cake
  updateFeaturedCake: async (
    id: string,
    cakeData: UpdateFeaturedCakeRequest,
  ) => {
    console.log(`FeaturedCakeStore: Updating featured cake ${id}...`, cakeData);
    set({ isLoading: true, error: null });
    try {
      const response = await featuredCakeApi.update(id, cakeData);
      console.log("FeaturedCakeStore: Update response:", response);

      if (response.success && response.data) {
        console.log(
          "FeaturedCakeStore: Featured cake updated successfully:",
          response.data,
        );
        const updatedCake = response.data;
        set((state) => ({
          featuredCakes: state.featuredCakes.map((cake: FeaturedCake) =>
            cake.id === id ? updatedCake : cake,
          ) as FeaturedCake[],
          currentFeaturedCake:
            updatedCake.id === state.currentFeaturedCake?.id
              ? updatedCake
              : state.currentFeaturedCake,
          isLoading: false,
        }));
        return updatedCake;
      } else {
        throw new Error(response.message || "Failed to update featured cake");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update featured cake";
      console.error("FeaturedCakeStore: Update failed:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Delete featured cake
  deleteFeaturedCake: async (id: string) => {
    console.log(`FeaturedCakeStore: Deleting featured cake ${id}...`);
    set({ isLoading: true, error: null });
    try {
      const response = await featuredCakeApi.delete(id);
      console.log("FeaturedCakeStore: Delete response:", response);

      if (response.success) {
        console.log("FeaturedCakeStore: Featured cake deleted successfully");
        set((state) => {
          const newCurrentCake =
            state.currentFeaturedCake?.id === id
              ? null
              : (state.currentFeaturedCake ?? null);
          return {
            featuredCakes: state.featuredCakes.filter(
              (cake: FeaturedCake) => cake.id !== id,
            ) as FeaturedCake[],
            currentFeaturedCake: newCurrentCake,
            isLoading: false,
          };
        });
      } else {
        throw new Error(response.message || "Failed to delete featured cake");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete featured cake";
      console.error("FeaturedCakeStore: Delete failed:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Toggle featured cake status
  toggleFeaturedCakeStatus: async (id: string) => {
    console.log(`FeaturedCakeStore: Toggling featured cake status ${id}...`);
    set({ isLoading: true, error: null });
    try {
      const response = await featuredCakeApi.toggleStatus(id);
      console.log("FeaturedCakeStore: Toggle status response:", response);

      if (response.success && response.data) {
        console.log(
          "FeaturedCakeStore: Featured cake status toggled successfully:",
          response.data,
        );
        const toggledCake = response.data;
        set((state) => ({
          featuredCakes: state.featuredCakes.map((cake: FeaturedCake) =>
            cake.id === id ? toggledCake : cake,
          ) as FeaturedCake[],
          currentFeaturedCake:
            toggledCake.id === state.currentFeaturedCake?.id
              ? toggledCake
              : state.currentFeaturedCake,
          isLoading: false,
        }));
        return toggledCake;
      } else {
        throw new Error(
          response.message || "Failed to toggle featured cake status",
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to toggle featured cake status";
      console.error("FeaturedCakeStore: Toggle status failed:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Clear error state
  clearError: () => set({ error: null }),

  // Reset featured cakes to empty state
  resetFeaturedCakes: () =>
    set({ featuredCakes: [], currentFeaturedCake: null, pagination: null }),

  // Upload featured cake image
  uploadFeaturedCakeImage: async (file: File) => {
    console.log(
      "FeaturedCakeStore.uploadFeaturedCakeImage called with file:",
      file.name,
      "size:",
      file.size,
      "type:",
      file.type,
    );
    set({ isLoading: true, error: null });
    try {
      console.log("Calling uploadImage with folder: basti/featured-cakes");
      const response = await uploadImage(file, "basti/featured-cakes");
      console.log("Image upload response:", response);

      if (response.success && response.data) {
        console.log("Upload successful, returning data:", response.data);
        set({ isLoading: false });
        return response.data;
      }
      const errorMsg = response.message || "Image upload failed";
      console.error("Upload failed - response indicates error:", errorMsg);
      throw new Error(errorMsg);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload image";
      console.error("Error uploading image:", errorMessage, error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Delete featured cake images
  deleteFeaturedCakeImages: async (urls: string[]) => {
    console.log(
      "FeaturedCakeStore.deleteFeaturedCakeImages called with urls:",
      urls,
    );
    set({ isLoading: true, error: null });
    try {
      const response = await deleteImages(urls);
      console.log("Image delete response:", response);
      if (response.success && response.data) {
        set({ isLoading: false });
        return response.data;
      }
      const errorMsg = response.message || "Image deletion failed";
      console.error("Deletion failed - response indicates error:", errorMsg);
      throw new Error(errorMsg);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete images";
      console.error("Error deleting images:", errorMessage, error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
