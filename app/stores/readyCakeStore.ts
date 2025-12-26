import { create } from "zustand";
import type { ReadyCake } from "@/data/products";
import { readyCakesData } from "@/data/ready-cakes";

interface ReadyCakeStore {
  readyCakes: ReadyCake[];
  addReadyCake: (cake: ReadyCake) => void;
  updateReadyCake: (id: string, cake: Omit<ReadyCake, "id">) => void;
  deleteReadyCake: (id: string) => void;
  toggleCakeActive: (id: string) => void;
}

export const useReadyCakeStore = create<ReadyCakeStore>((set) => ({
  readyCakes: readyCakesData,

  addReadyCake: (cake) =>
    set((state) => ({
      readyCakes: [...state.readyCakes, cake],
    })),

  updateReadyCake: (id, updatedCake) =>
    set((state) => ({
      readyCakes: state.readyCakes.map((cake) =>
        cake.id === id ? { ...cake, ...updatedCake, id } : cake
      ),
    })),

  deleteReadyCake: (id) =>
    set((state) => ({
      readyCakes: state.readyCakes.filter((cake) => cake.id !== id),
    })),

  toggleCakeActive: (id) =>
    set((state) => ({
      readyCakes: state.readyCakes.map((cake) =>
        cake.id === id ? { ...cake, isActive: !cake.isActive } : cake
      ),
    })),
}));
