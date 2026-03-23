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
  isCached: boolean;

  // Actions
  fetchRegions: (forceRefresh?: boolean) => Promise<void>;
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
  changeRegionOrder: (id: string, newOrder: number) => Promise<void>;
  uploadRegionImage: (file: File) => Promise<CloudinaryUploadResult>;
  clearError: () => void;
  resetRegions: () => void;
}

export const useRegionStore = create<RegionState>((set, get) => ({
  // Initial state
  regions: [],
  currentRegion: null,
  isLoading: false,
  error: null,
  isCached: false,

  // Fetch all regions from API
  fetchRegions: async (forceRefresh = false) => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state.isCached && state.regions.length > 0 && !forceRefresh) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await regionApi.getAll();

      if (response.success && response.data) {
        set({
          regions: response.data,
          isLoading: false,
          isCached: true,
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

  // Change region order
  changeRegionOrder: async (id: string, newOrder: number) => {
    // Optimistic update: apply new order locally immediately, call API, rollback on error
    set({ error: null });

    const prevRegions = get().regions;

    // Build a new ordered array based on current regions and desired position
    const currentOrdered = [...prevRegions].sort((a, b) => a.order - b.order);

    const movingIndex = currentOrdered.findIndex((r) => r.id === id);
    if (movingIndex === -1) return;

    const movingRegion = currentOrdered[movingIndex];

    // Remove the moving region
    currentOrdered.splice(movingIndex, 1);

    // Insert at target index (convert to 0-based)
    const targetIndex = Math.max(
      0,
      Math.min(newOrder - 1, currentOrdered.length),
    );
    currentOrdered.splice(targetIndex, 0, movingRegion);

    // Reassign continuous order numbers starting from 1
    const optimisticRegions = currentOrdered.map((r, idx) => ({
      ...r,
      order: idx + 1,
    }));

    // Apply optimistic update immediately
    set({ regions: optimisticRegions });

    try {
      const response = await regionApi.changeOrder(id, newOrder);

      if (response.success) {
        // Success: do not overwrite optimistic local state. Server acknowledged the change.
        // Clear any previous error but keep the optimistic `regions` as-is.
        set({ error: null });
      } else {
        // Rollback to previous state on failure
        set({
          regions: prevRegions,
          error: response.message || "Failed to change region order",
        });
        throw new Error(response.message || "Failed to change region order");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to change region order";
      // Rollback to previous regions
      set({ regions: prevRegions, error: errorMessage });
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
