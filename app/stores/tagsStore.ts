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
