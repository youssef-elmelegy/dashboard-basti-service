import { create } from "zustand";
import {
  tagsApi,
  type Tag,
  type CreateTagRequest,
  type UpdateTagRequest,
} from "@/lib/services/tags.service";

interface TagsState {
  tags: Tag[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isCached: boolean;

  // Actions
  fetchTags: (forceRefresh?: boolean) => Promise<void>;
  createTag: (data: CreateTagRequest) => Promise<Tag | null>;
  updateTag: (id: string, data: UpdateTagRequest) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<boolean>;
  changeTagOrder: (id: string, newOrder: number) => Promise<void>;
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  setTags: (tags: Tag[]) => void;
  clearError: () => void;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  isLoading: false,
  isSaving: false,
  error: null,
  isCached: false,

  // Fetch all tags from API
  fetchTags: async (forceRefresh = false) => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state.isCached && state.tags.length > 0 && !forceRefresh) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await tagsApi.getAll();

      if (response.success && response.data) {
        set({ tags: response.data, isLoading: false, isCached: true });
      } else {
        const error = response.message || "Failed to fetch tags";
        set({ error, isLoading: false });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch tags";
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Create a new tag via API and add to state
  createTag: async (data: CreateTagRequest) => {
    set({ isSaving: true, error: null });
    try {
      const response = await tagsApi.create(data);
      if (response.success && response.data) {
        const newTag = response.data as Tag;
        const current = get().tags;
        const updated = [...current, newTag];
        set({ tags: updated, isSaving: false });
        return response.data;
      } else {
        const error = response.message || "Failed to create tag";
        set({ error, isSaving: false });
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create tag";
      set({ error: errorMessage, isSaving: false });
      return null;
    }
  },

  // Update an existing tag via API and update state
  updateTag: async (id: string, data: UpdateTagRequest) => {
    set({ isSaving: true, error: null });
    try {
      const response = await tagsApi.update(id, data);
      if (response.success && response.data) {
        const updatedTag = response.data as Tag;
        const current = get().tags;
        const updated = current.map((t) => (t.id === id ? updatedTag : t));
        set({ tags: updated, isSaving: false });
        return updatedTag;
      } else {
        const error = response.message || "Failed to update tag";
        set({ error, isSaving: false });
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update tag";
      set({ error: errorMessage, isSaving: false });
      return null;
    }
  },

  // Delete a tag via API and remove from state
  deleteTag: async (id: string) => {
    set({ isSaving: true, error: null });
    try {
      const response = await tagsApi.delete(id);
      if (response.success) {
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
          isSaving: false,
        }));
        return true;
      } else {
        const error = response.message || "Failed to delete tag";
        set({ error, isSaving: false });
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete tag";
      set({ error: errorMessage, isSaving: false });
      return false;
    }
  },

  // Change tag order
  changeTagOrder: async (id: string, newOrder: number) => {
    // Optimistic update: apply new order locally immediately, call API, rollback on error
    set({ error: null });

    const prevTags = get().tags;

    // Build a new ordered array based on current tags and desired position
    const currentOrdered = [...prevTags].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );

    const movingIndex = currentOrdered.findIndex((t) => t.id === id);
    if (movingIndex === -1) return;

    const movingTag = currentOrdered[movingIndex];

    // Remove the moving tag
    currentOrdered.splice(movingIndex, 1);

    // Insert at target index (convert to 0-based)
    const targetIndex = Math.max(
      0,
      Math.min(newOrder - 1, currentOrdered.length),
    );
    currentOrdered.splice(targetIndex, 0, movingTag);

    // Reassign continuous order numbers starting from 1
    const optimisticTags = currentOrdered.map((t, idx) => ({
      ...t,
      displayOrder: idx + 1,
    }));

    // Apply optimistic update immediately
    set({ tags: optimisticTags });

    try {
      const response = await tagsApi.changeOrder(id, newOrder);

      if (response.success && response.data) {
        // Success: update with server response
        set({ tags: response.data, error: null });
      } else {
        // Rollback to previous state on failure
        set({
          tags: prevTags,
          error: response.message || "Failed to change tag order",
        });
        throw new Error(response.message || "Failed to change tag order");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to change tag order";
      // Rollback to previous tags
      set({ tags: prevTags, error: errorMessage });
      throw error;
    }
  },

  // Add a new tag to the local state
  addTag: (tag: Tag) =>
    set((state) => ({
      tags: state.tags.some((t) => t.id === tag.id)
        ? state.tags
        : [...state.tags, tag],
    })),

  // Remove a tag by ID
  removeTag: (tagId: string) =>
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== tagId),
    })),

  // Set all tags
  setTags: (tags: Tag[]) => set({ tags }),

  // Clear error
  clearError: () => set({ error: null }),
}));
