import { create } from "zustand";
import { uploadImage, type CloudinaryUploadResult } from "@/lib/api/cake.api";

interface ImageStore {
  uploadCakeImage: (
    file: File,
    folder?: string,
  ) => Promise<CloudinaryUploadResult>;
}

export const useImageStore = create<ImageStore>(() => ({
  uploadCakeImage: async (
    file: File,
    folder: string = "basti/cakes",
  ): Promise<CloudinaryUploadResult> => {
    const response = await uploadImage(file, folder);
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to upload image");
    }
    return response.data;
  },
}));

// Alias for backward compatibility
export const useCakeStore = useImageStore;
