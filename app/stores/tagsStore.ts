import { create } from "zustand";
import { tagsApi, type Tag } from "@/lib/services/tags.service";

interface TagsState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  isCached: boolean;

  // Actions
  fetchTags: (forceRefresh?: boolean) => Promise<void>;
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  setTags: (tags: Tag[]) => void;
  clearError: () => void;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  isLoading: false,
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
