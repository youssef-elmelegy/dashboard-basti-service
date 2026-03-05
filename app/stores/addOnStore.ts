import { create } from "zustand";
import {
  addOnApi,
  type AddOn,
  type CreateAddOnRequest,
  type UpdateAddOnRequest,
} from "@/lib/services/addOn.service";
import {
  uploadImage,
  deleteImages,
  type CloudinaryUploadResult,
  type DeleteImageResult,
} from "@/lib/api/addOn.api";

interface AddOnStore {
  // Data
  addOns: AddOn[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAddOns: (page?: number, limit?: number) => Promise<void>;
  addAddOn: (addOn: CreateAddOnRequest) => Promise<AddOn>;
  updateAddOn: (id: string, addOn: UpdateAddOnRequest) => Promise<AddOn>;
  deleteAddOn: (id: string) => Promise<void>;
  toggleAddOnActive: (id: string) => Promise<AddOn>;
  uploadAddOnImage: (file: File) => Promise<CloudinaryUploadResult>;
  deleteAddOnImages: (urls: string[]) => Promise<DeleteImageResult>;
  clearError: () => void;
}

export const useAddOnStore = create<AddOnStore>((set) => ({
  // Initial state
  addOns: [],
  isLoading: false,
  error: null,

  // Fetch all add-ons from API
  fetchAddOns: async (page = 1, limit = 10) => {
    console.log(
      `AddOnStore: Fetching add-ons (page: ${page}, limit: ${limit})...`,
    );
    set({ isLoading: true, error: null });
    try {
      const response = await addOnApi.getAll({ page, limit });
      console.log("AddOnStore: API response:", response);

      if (response.success && response.data) {
        console.log("AddOnStore: Add-ons fetched successfully:", response.data);
        set({
          addOns: response.data.items,
          isLoading: false,
        });
      } else {
        const error = response.message || "Failed to fetch add-ons";
        console.error("AddOnStore: API returned error:", error);
        throw new Error(error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch add-ons";
      console.error("AddOnStore: Fetch failed:", errorMessage, error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Create new add-on
  addAddOn: async (addOn: CreateAddOnRequest) => {
    console.log("AddOnStore: Creating add-on...", addOn);
    set({ isLoading: true, error: null });
    try {
      const response = await addOnApi.create(addOn);
      console.log("AddOnStore: Create response:", response);

      if (response.success && response.data) {
        console.log("AddOnStore: Add-on created successfully:", response.data);
        set((state) => ({
          addOns: [...state.addOns, response.data] as AddOn[],
          isLoading: false,
        }));
        return response.data;
      } else {
        throw new Error(response.message || "Failed to create add-on");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create add-on";
      console.error("AddOnStore: Create failed:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Update add-on
  updateAddOn: async (id: string, addOn: UpdateAddOnRequest) => {
    console.log(`AddOnStore: Updating add-on ${id}...`, addOn);
    set({ isLoading: true, error: null });
    try {
      const response = await addOnApi.update(id, addOn);
      console.log("AddOnStore: Update response:", response);

      if (response.success && response.data) {
        console.log("AddOnStore: Add-on updated successfully:", response.data);
        const updatedAddOn = response.data;
        set((state) => ({
          addOns: state.addOns.map((a: AddOn) =>
            a.id === id ? updatedAddOn : a,
          ) as AddOn[],
          isLoading: false,
        }));
        return updatedAddOn;
      } else {
        throw new Error(response.message || "Failed to update add-on");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update add-on";
      console.error("AddOnStore: Update failed:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Delete add-on
  deleteAddOn: async (id: string) => {
    console.log(`AddOnStore: Deleting add-on ${id}...`);
    set({ isLoading: true, error: null });
    try {
      const response = await addOnApi.delete(id);
      console.log("AddOnStore: Delete response:", response);

      if (response.success) {
        console.log("AddOnStore: Add-on deleted successfully");
        set((state) => ({
          addOns: state.addOns.filter((a: AddOn) => a.id !== id) as AddOn[],
          isLoading: false,
        }));
      } else {
        throw new Error(response.message || "Failed to delete add-on");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete add-on";
      console.error("AddOnStore: Delete failed:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Toggle add-on status
  toggleAddOnActive: async (id: string) => {
    console.log(`AddOnStore: Toggling add-on status ${id}...`);
    set({ isLoading: true, error: null });
    try {
      const response = await addOnApi.toggleStatus(id);
      console.log("AddOnStore: Toggle status response:", response);

      if (response.success && response.data) {
        console.log(
          "AddOnStore: Add-on status toggled successfully:",
          response.data,
        );
        const toggledAddOn = response.data;
        set((state) => ({
          addOns: state.addOns.map((a: AddOn) =>
            a.id === id ? toggledAddOn : a,
          ) as AddOn[],
          isLoading: false,
        }));
        return toggledAddOn;
      } else {
        throw new Error(response.message || "Failed to toggle add-on status");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to toggle add-on status";
      console.error("AddOnStore: Toggle status failed:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Upload add-on image
  uploadAddOnImage: async (file: File) => {
    console.log(
      "AddOnStore.uploadAddOnImage called with file:",
      file.name,
      "size:",
      file.size,
      "type:",
      file.type,
    );
    set({ isLoading: true, error: null });
    try {
      console.log("Calling uploadImage with folder: basti/addons");
      const response = await uploadImage(file, "basti/addons");
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

  // Delete add-on images
  deleteAddOnImages: async (urls: string[]) => {
    console.log("AddOnStore.deleteAddOnImages called with urls:", urls);
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

  // Clear error state
  clearError: () => set({ error: null }),
}));
