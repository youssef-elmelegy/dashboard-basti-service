import { create } from "zustand";
import {
  chefApi,
  type Chef,
  type CreateChefRequest,
  type UpdateChefRequest,
} from "@/lib/services/chef.service";
import {
  uploadImage,
  deleteImages,
  type CloudinaryUploadResult,
  type DeleteImageResult,
} from "@/lib/api/chef.api";

interface ChefStore {
  chefs: Chef[];
  isLoading: boolean;
  error: string | null;
  isCached: boolean;

  fetchChefs: (
    page?: number,
    limit?: number,
    forceRefresh?: boolean,
  ) => Promise<void>;
  addChef: (data: CreateChefRequest) => Promise<void>;
  updateChef: (id: string, data: UpdateChefRequest) => Promise<void>;
  deleteChef: (id: string) => Promise<void>;
  uploadChefImage: (file: File) => Promise<CloudinaryUploadResult>;
  deleteChefImages: (urls: string[]) => Promise<DeleteImageResult>;
  clearError: () => void;
  resetChefs: () => void;
}

export const useChefStore = create<ChefStore>((set, get) => ({
  chefs: [],
  isLoading: false,
  error: null,
  isCached: false,

  fetchChefs: async (page = 1, limit = 10, forceRefresh = false) => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state.isCached && state.chefs.length > 0 && !forceRefresh) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await chefApi.getAll(page, limit);
      if (response.success && response.data) {
        set({ chefs: response.data.items, isLoading: false, isCached: true });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch chefs";
      set({ error: errorMessage, isLoading: false });
    }
  },

  addChef: async (data) => {
    console.log("ChefStore.addChef called with:", data);

    // Validate bakeryId
    if (!data.bakeryId) {
      const error = "BakeryId is required and cannot be empty";
      console.error(error);
      set({ error, isLoading: false });
      throw new Error(error);
    }

    set({ isLoading: true, error: null });
    try {
      const response = await chefApi.create(data);
      console.log("Chef create response:", response);
      if (response.success && response.data) {
        set((state) => ({
          chefs: [...state.chefs, response.data as Chef],
          isLoading: false,
        }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add chef";
      console.error("Error adding chef:", errorMessage, error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateChef: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chefApi.update(id, data);
      if (response.success && response.data) {
        set((state) => ({
          chefs: state.chefs.map((chef) =>
            chef.id === id ? (response.data as Chef) : chef,
          ),
          isLoading: false,
        }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update chef";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteChef: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chefApi.delete(id);
      if (response.success) {
        set((state) => ({
          chefs: state.chefs.filter((chef) => chef.id !== id),
          isLoading: false,
        }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete chef";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  resetChefs: () => set({ chefs: [], isLoading: false, error: null }),

  uploadChefImage: async (file) => {
    console.log(
      "ChefStore.uploadChefImage called with file:",
      file.name,
      "size:",
      file.size,
      "type:",
      file.type,
    );
    set({ isLoading: true, error: null });
    try {
      console.log("Calling uploadImage with folder: basti/chefs");
      const response = await uploadImage(file, "basti/chefs");
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

  deleteChefImages: async (urls) => {
    console.log("ChefStore.deleteChefImages called with urls:", urls);
    set({ isLoading: true, error: null });
    try {
      const response = await deleteImages(urls);
      console.log("Image delete response:", response);
      if (response.success && response.data) {
        set({ isLoading: false });
        return response.data;
      }
      throw new Error(response.message || "Image deletion failed");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete images";
      console.error("Error deleting images:", errorMessage, error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
