import { create } from "zustand";
import type { SmallCake } from "@/data/products";
import { smallCakesData } from "@/data/small-cakes";

interface SmallCakeStore {
  smallCakes: SmallCake[];
  addSmallCake: (cake: SmallCake) => void;
  updateSmallCake: (id: string, cake: Omit<SmallCake, "id">) => void;
  deleteSmallCake: (id: string) => void;
  toggleCakeActive: (id: string) => void;
}

export const useSmallCakeStore = create<SmallCakeStore>((set) => ({
  smallCakes: smallCakesData,

  addSmallCake: (cake) =>
    set((state) => ({
      smallCakes: [...state.smallCakes, cake],
    })),

  updateSmallCake: (id, updatedCake) =>
    set((state) => ({
      smallCakes: state.smallCakes.map((cake) =>
        cake.id === id ? { ...cake, ...updatedCake, id } : cake
      ),
    })),

  deleteSmallCake: (id) =>
    set((state) => ({
      smallCakes: state.smallCakes.filter((cake) => cake.id !== id),
    })),

  toggleCakeActive: (id) =>
    set((state) => ({
      smallCakes: state.smallCakes.map((cake) =>
        cake.id === id ? { ...cake, isActive: !cake.isActive } : cake
      ),
    })),
}));
