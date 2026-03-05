/**
 * Region Store (Zustand)
 *
 * This store manages region data with API integration.
 * It handles fetching, caching, and mutations for regions.
 *
 * Features:
 * - Centralized API calls through regionApi service
 * - Loading and error state management
 * - Automatic caching with manual refresh
 * - Type-safe operations
 */

import { create } from "zustand";
import { regionApi } from "@/lib/services/region.service";
import { uploadImage, type CloudinaryUploadResult } from "@/lib/api/cake.api";
import type { Region } from "@/data/regions";

interface RegionState {
  // Data
  regions: Region[];
  currentRegion: Region | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRegions: () => Promise<void>;
  fetchRegionById: (id: string) => Promise<Region>;
  addRegion: (regionData: {
    name: string;
    image?: string;
    isAvailable?: boolean;
  }) => Promise<void>;
  updateRegion: (
    id: string,
    regionData: { name: string; image?: string; isAvailable?: boolean },
  ) => Promise<void>;
  deleteRegion: (id: string) => Promise<void>;
  uploadRegionImage: (file: File) => Promise<CloudinaryUploadResult>;
  clearError: () => void;
  resetRegions: () => void;
}

export const useRegionStore = create<RegionState>((set) => ({
  // Initial state
  regions: [],
  currentRegion: null,
  isLoading: false,
  error: null,

  // Fetch all regions from API
  fetchRegions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.getAll();

      if (response.success && response.data) {
        set({
          regions: response.data,
          isLoading: false,
        });
      } else {
        throw new Error(response.message || "Failed to fetch regions");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch regions";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Fetch a single region by ID
  fetchRegionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.getOne(id);

      if (response.success && response.data) {
        set({
          currentRegion: response.data,
          isLoading: false,
        });
        return response.data;
      } else {
        throw new Error(response.message || "Failed to fetch region");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch region";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Add new region
  addRegion: async (regionData: {
    name: string;
    image?: string;
    isAvailable?: boolean;
  }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.create(regionData);

      if (response.success && response.data) {
        set((state) => ({
          regions: [...state.regions, response.data as Region],
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to create region");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create region";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Update existing region
  updateRegion: async (
    id: string,
    regionData: { name: string; image?: string; isAvailable?: boolean },
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.update(id, regionData);

      if (response.success && response.data) {
        set((state) => ({
          regions: state.regions.map((r) =>
            r.id === id ? (response.data as Region) : r,
          ),
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to update region");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update region";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Delete region
  deleteRegion: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.delete(id);

      if (response.success) {
        set((state) => ({
          regions: state.regions.filter((r) => r.id !== id),
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to delete region");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete region";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Clear error message
  clearError: () => {
    set({ error: null });
  },

  // Reset to initial state
  resetRegions: () => {
    set({
      regions: [],
      currentRegion: null,
      isLoading: false,
      error: null,
    });
  },

  // Upload region image to Cloudinary
  uploadRegionImage: async (file: File) => {
    console.log(
      "RegionStore.uploadRegionImage called with file:",
      file.name,
      "size:",
      file.size,
      "type:",
      file.type,
    );
    set({ isLoading: true, error: null });
    try {
      console.log("Calling uploadImage with folder: basti/general");
      const response = await uploadImage(file, "basti/general");
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
}));
