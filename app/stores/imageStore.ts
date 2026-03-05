import { create } from "zustand";
import { apiClient } from "@/lib/api-client";

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

interface ImageStore {
  uploadCakeImage: (file: File, folder?: string) => Promise<CloudinaryResponse>;
}

export const useImageStore = create<ImageStore>(() => ({
  uploadCakeImage: async (
    file: File,
    folder: string = "basti",
  ): Promise<CloudinaryResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post<CloudinaryResponse>(
        `/uploads/image?folder=${folder}`,
        formData,
      );
      if (!response.data) {
        throw new Error("Upload response data is empty");
      }
      return response.data;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to upload image";
      throw new Error(errorMsg);
    }
  },
}));

// Alias for backward compatibility
export const useCakeStore = useImageStore;
