import { create } from "zustand";
import type { SmallCake, AddOn } from "@/data/products";

export type SelectedProductItem = {
  id: string;
  regionId: string;
  regionName: string;
  type: "cake" | "sweet";
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  selectedSizes: Array<{ name: string; price: number }>; // For cakes - array of selected sizes
  addedAt: Date;
};

interface RegionProductSelectionStore {
  selectedProducts: SelectedProductItem[];
  addProduct: (
    regionName: string,
    regionId: string,
    type: "cake" | "sweet",
    product: SmallCake | AddOn,
    selectedSizes?: Array<{ name: string; price: number }>,
  ) => void;
  removeProduct: (id: string) => void;
  clearAll: () => void;
  getProductsByRegion: (regionName: string) => SelectedProductItem[];
  updateProduct: (id: string, updated: Partial<SelectedProductItem>) => void;
}

export const useRegionProductSelectionStore =
  create<RegionProductSelectionStore>((set, get) => ({
    updateProduct: (id, updated) => {
      set((state) => ({
        selectedProducts: state.selectedProducts.map((p) =>
          p.id === id ? { ...p, ...updated } : p,
        ),
      }));
    },
    selectedProducts: [],

    addProduct: (regionName, regionId, type, product, selectedSizes = []) => {
      set((state) => {
        let basePrice = 0;
        let finalSelectedSizes: Array<{ name: string; price: number }> = [];

        if (type === "cake") {
          const cake = product as SmallCake;
          basePrice = cake.mainPrice;

          // If selectedSizes provided, use them; otherwise use the base price
          if (selectedSizes && selectedSizes.length > 0) {
            finalSelectedSizes = selectedSizes;
          }
        } else {
          const addon = product as AddOn;
          basePrice = addon.price || 0;
        }

        const newProduct: SelectedProductItem = {
          id: `${Date.now()}-${Math.random()}`,
          regionId,
          regionName,
          type,
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0] || "",
          basePrice,
          selectedSizes: finalSelectedSizes,
          addedAt: new Date(),
        };

        return {
          selectedProducts: [...state.selectedProducts, newProduct],
        };
      });
    },

    removeProduct: (id) => {
      set((state) => ({
        selectedProducts: state.selectedProducts.filter((p) => p.id !== id),
      }));
    },

    clearAll: () => {
      set({ selectedProducts: [] });
    },

    getProductsByRegion: (regionName) => {
      return get().selectedProducts.filter((p) => p.regionName === regionName);
    },
  }));
