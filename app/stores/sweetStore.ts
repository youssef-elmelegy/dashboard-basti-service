import { create } from "zustand";
import type { Sweet } from "@/data/products";

interface SweetStore {
  sweets: Sweet[];
  addSweet: (sweet: Sweet) => void;
  updateSweet: (id: string, sweet: Omit<Sweet, "id">) => void;
  deleteSweet: (id: string) => void;
  toggleSweetActive: (id: string) => void;
}

export const useSweetStore = create<SweetStore>((set) => ({
  sweets: [
    {
      id: "sweet1",
      name: "Chocolate Truffles",
      description: "Rich, creamy chocolate truffles with various flavors",
      image:
        "https://images.unsplash.com/photo-1624353365960-3da42522f891?w=500&h=500&fit=crop",
      tags: ["birthday", "custom"],
      price: 25,
      capacity: 12,
      isActive: true,
    },
    {
      id: "sweet2",
      name: "Macarons Set",
      description: "Delicate French macarons in assorted colors and flavors",
      image:
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=500&fit=crop",
      tags: ["wedding", "anniversary"],
      price: 35,
      capacity: 24,
      isActive: true,
    },
  ],

  addSweet: (sweet) =>
    set((state) => ({
      sweets: [...state.sweets, sweet],
    })),

  updateSweet: (id, updatedSweet) =>
    set((state) => ({
      sweets: state.sweets.map((sweet) =>
        sweet.id === id ? { ...sweet, ...updatedSweet, id } : sweet
      ),
    })),

  deleteSweet: (id) =>
    set((state) => ({
      sweets: state.sweets.filter((sweet) => sweet.id !== id),
    })),

  toggleSweetActive: (id) =>
    set((state) => ({
      sweets: state.sweets.map((sweet) =>
        sweet.id === id ? { ...sweet, isActive: !sweet.isActive } : sweet
      ),
    })),
}));
