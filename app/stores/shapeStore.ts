import { create } from "zustand";
import {
  shapeApi,
  type Shape,
  type ShapeConflictData,
  type CreateShapeRequest,
  type UpdateShapeRequest,
} from "@/lib/services/shape.service";
import { uploadImage, type CloudinaryUploadResult } from "@/lib/api/cake.api";

interface ShapeState {
  shapes: Shape[];
  isLoading: boolean;
  error: string | null;
  isCached: boolean;
  shapeConflict: (ShapeConflictData & { shapeId: string }) | null;
  fetchShapes: (
    page?: number,
    limit?: number,
    search?: string,
    forceRefresh?: boolean,
  ) => Promise<void>;
  addShape: (data: CreateShapeRequest) => Promise<Shape>;
  updateShape: (id: string, data: UpdateShapeRequest) => Promise<Shape>;
  deleteShape: (id: string) => Promise<void>;
  forceDeleteShape: (id: string) => Promise<void>;
  changeShapeOrder: (id: string, newOrder: number) => Promise<void>;
  clearConflict: () => void;
  uploadShapeImage: (file: File) => Promise<CloudinaryUploadResult>;
  clearError: () => void;
}

export const useShapeStore = create<ShapeState>((set, get) => ({
  shapes: [],
  isLoading: false,
  error: null,
  isCached: false,
  shapeConflict: null,

  fetchShapes: async (
    _page?: number,
    _limit?: number,
    search?: string,
    forceRefresh = false,
  ) => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state.isCached && state.shapes.length > 0 && !forceRefresh) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await shapeApi.getAll(search);
      if (response.success && response.data) {
        // response.data can be either an array or a PaginatedResponse
        const shapesArray = Array.isArray(response.data)
          ? response.data
          : response.data.items || [];
        set({ shapes: shapesArray, isLoading: false, isCached: true });
      } else {
        set({ shapes: [], isLoading: false });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch shapes";
      set({ error: errorMsg, shapes: [], isLoading: false });
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
    set({ isLoading: true, error: null, shapeConflict: null });
    try {
      const response = await shapeApi.delete(id);
      if (response.success) {
        set((state) => ({
          shapes: state.shapes.filter((s) => s.id !== id),
          isLoading: false,
        }));
      }
    } catch (error) {
      // 409 Conflict — shape has related predesigned cake configs
      const apiErr = error as {
        code?: number;
        data?: {
          relatedConfigsCount?: number;
          affectedPredesignedCakesCount?: number;
          affectedPredesignedCakeIds?: string[];
        };
        message?: string;
      };
      if (
        apiErr.code === 409 &&
        apiErr.data?.relatedConfigsCount !== undefined
      ) {
        set({
          isLoading: false,
          shapeConflict: {
            shapeId: id,
            relatedConfigsCount: apiErr.data.relatedConfigsCount ?? 0,
            affectedPredesignedCakesCount:
              apiErr.data.affectedPredesignedCakesCount ?? 0,
            affectedPredesignedCakeIds:
              apiErr.data.affectedPredesignedCakeIds ?? [],
          },
        });
      } else {
        const errorMsg = apiErr.message ?? "Failed to delete shape";
        set({ error: errorMsg, isLoading: false });
        throw error;
      }
    }
  },

  forceDeleteShape: async (id) => {
    set({ isLoading: true, error: null, shapeConflict: null });
    try {
      await shapeApi.forceDelete(id);
      set((state) => ({
        shapes: state.shapes.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to force-delete shape";
      set({ error: errorMsg, isLoading: false });
      throw error;
    }
  },

  changeShapeOrder: async (id: string, newOrder: number) => {
    // Optimistic update: apply new order locally immediately, call API, rollback on error
    set({ error: null });

    const prevShapes = get().shapes;

    const currentOrdered = [...prevShapes].sort((a, b) => a.order - b.order);
    const movingIndex = currentOrdered.findIndex((s) => s.id === id);
    if (movingIndex === -1) return;

    const movingShape = currentOrdered[movingIndex];
    currentOrdered.splice(movingIndex, 1);
    const targetIndex = Math.max(
      0,
      Math.min(newOrder - 1, currentOrdered.length),
    );
    currentOrdered.splice(targetIndex, 0, movingShape);

    const optimisticShapes = currentOrdered.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));
    set({ shapes: optimisticShapes });

    try {
      const response = await shapeApi.changeOrder(id, newOrder);
      if (response.success) {
        // Success: keep optimistic state and clear any error
        set({ error: null });
      } else {
        set({
          shapes: prevShapes,
          error: response.message || "Failed to change shape order",
        });
        throw new Error(response.message || "Failed to change shape order");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to change shape order";
      set({ shapes: prevShapes, error: errorMsg });
      throw error;
    }
  },

  clearConflict: () => set({ shapeConflict: null }),

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
