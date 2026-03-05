import { create } from "zustand";
import { shapeApi, type Shape } from "@/lib/services/shape.service";
import { uploadImage, type CloudinaryUploadResult } from "@/lib/api/cake.api";

interface ShapeState {
  shapes: Shape[];
  isLoading: boolean;
  error: string | null;
  fetchShapes: (
    page?: number,
    limit?: number,
    search?: string,
  ) => Promise<void>;
  addShape: (
    data: Omit<Shape, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Shape>;
  updateShape: (
    id: string,
    data: Partial<Omit<Shape, "id" | "createdAt" | "updatedAt">>,
  ) => Promise<Shape>;
  deleteShape: (id: string) => Promise<void>;
  uploadShapeImage: (file: File) => Promise<CloudinaryUploadResult>;
  clearError: () => void;
}

export const useShapeStore = create<ShapeState>((set) => ({
  shapes: [],
  isLoading: false,
  error: null,

  fetchShapes: async (_page?: number, _limit?: number, search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await shapeApi.getAll(search);
      if (response.success && response.data) {
        // response.data is PaginatedResponse<Shape>
        const shapes = response.data.items;
        set({ shapes, isLoading: false });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch shapes";
      set({ error: errorMsg, isLoading: false });
    }
  },

  addShape: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await shapeApi.create(data);
      if (response.success && response.data) {
        set((state) => ({
          shapes: [...state.shapes, response.data as Shape],
          isLoading: false,
        }));
        return response.data;
      }
      throw new Error(response.message || "Failed to create shape");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create shape";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  updateShape: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await shapeApi.update(id, data);
      if (response.success && response.data) {
        set((state) => ({
          shapes: state.shapes.map((s) =>
            s.id === id ? (response.data as Shape) : s,
          ),
          isLoading: false,
        }));
        return response.data;
      }
      throw new Error(response.message || "Failed to update shape");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update shape";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  deleteShape: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await shapeApi.delete(id);
      if (response.success) {
        set((state) => ({
          shapes: state.shapes.filter((s) => s.id !== id),
          isLoading: false,
        }));
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete shape";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  uploadShapeImage: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const response = await uploadImage(file, "basti/shapes");
      if (response.success && response.data) {
        set({ isLoading: false });
        return response.data;
      }
      const errorMsg = response.message || "Image upload failed";
      throw new Error(errorMsg);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to upload image";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
