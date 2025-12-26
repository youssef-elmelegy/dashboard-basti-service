import { create } from "zustand";
import type { CakeTag } from "@/data/products";

interface TagsState {
  tags: CakeTag[];
  addTag: (tag: CakeTag) => void;
  removeTag: (tag: CakeTag) => void;
  setTags: (tags: CakeTag[]) => void;
}

const DEFAULT_TAGS: CakeTag[] = [
  "birthday",
  "anniversary",
  "wedding",
  "graduation",
  "engagement",
  "custom",
];

export const useTagsStore = create<TagsState>((set) => ({
  tags: DEFAULT_TAGS,

  addTag: (tag: CakeTag) =>
    set((state) => ({
      tags: state.tags.includes(tag) ? state.tags : [...state.tags, tag],
    })),

  removeTag: (tag: CakeTag) =>
    set((state) => ({
      tags: state.tags.filter((t) => t !== tag),
    })),

  setTags: (tags: CakeTag[]) => set({ tags }),
}));
