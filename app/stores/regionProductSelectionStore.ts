import { create } from "zustand";
import type { SmallCake, AddOn } from "@/data/products";
import type { ProductType } from "@/routes/management/types";

// Extended product type to support flavor, shape, decoration, etc.
type ExtendedProduct = (SmallCake | AddOn) & {
  thumbnailUrl?: string;
  flavorUrl?: string;
  shapeUrl?: string;
  decorationUrl?: string;
  title?: string;
};

export type SelectedProductItem = {
  id: string;
  regionId: string;
  regionName: string;
  type: "cake" | "sweet";
  productType?: ProductType; // The specific product type (flavor, shape, decoration, etc.)
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
    basePrice?: number,
    productType?: ProductType,
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

    addProduct: (
      regionName,
      regionId,
      type,
      product,
      selectedSizes = [],
      basePrice,
      productType,
    ) => {
      set((state) => {
        let finalBasePrice = basePrice || 0;
        let finalSelectedSizes: Array<{ name: string; price: number }> = [];

        if (type === "cake") {
          const cake = product as SmallCake;
          finalBasePrice = basePrice !== undefined ? basePrice : cake.mainPrice;

          // If selectedSizes provided, use them
          if (selectedSizes && selectedSizes.length > 0) {
            finalSelectedSizes = selectedSizes;
          }
        } else {
          const addon = product as AddOn;
          finalBasePrice =
            basePrice !== undefined ? basePrice : addon.price || 0;
        }

        // Extract image based on product type
        const extendedProduct = product as ExtendedProduct;
        let productImage = "";
        if (extendedProduct.thumbnailUrl) {
          productImage = extendedProduct.thumbnailUrl;
        } else if (extendedProduct.flavorUrl) {
          productImage = extendedProduct.flavorUrl;
        } else if (extendedProduct.shapeUrl) {
          productImage = extendedProduct.shapeUrl;
        } else if (extendedProduct.decorationUrl) {
          productImage = extendedProduct.decorationUrl;
        } else if (product.images?.[0]) {
          productImage = product.images[0];
        }

        const newProduct: SelectedProductItem = {
          id: `${Date.now()}-${Math.random()}`,
          regionId,
          regionName,
          type,
          productType,
          productId: product.id,
          productName: product.name || extendedProduct.title || "",
          productImage,
          basePrice: finalBasePrice,
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
