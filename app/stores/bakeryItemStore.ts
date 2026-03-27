/**
 * Bakery Item Store (Zustand)
 *
 * This store manages bakery item stores data with API integration.
 * It handles fetching, caching, and mutations for bakery items.
 */

import { create } from "zustand";
import { bakeryApi, type BakeryItemStore } from "@/lib/services/bakery.service";

interface BakeryItemStoreState {
  // Data
  items: BakeryItemStore[];
  isLoading: boolean;
  error: string | null;
  lastFetchTime: Record<string, number>; // Key: bakeryId

  // Actions
  fetchBakeryItems: (bakeryId: string, forceRefresh?: boolean) => Promise<void>;
  getItemsByBakery: (bakeryId: string) => BakeryItemStore[];
  updateItemStock: (
    bakeryId: string,
    storeId: string,
    payload:
      | number
      | {
          stock: number;
          optionsStock?: Array<{ optionId: string; stock: number }>;
        },
  ) => Promise<void>;
  clearItems: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useBakeryItemStore = create<BakeryItemStoreState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  lastFetchTime: {},

  fetchBakeryItems: async (bakeryId: string, forceRefresh = false) => {
    const state = get();
    const lastFetch = state.lastFetchTime[bakeryId];
    const now = Date.now();

    // Check if we have cached data and it's still fresh
    if (!forceRefresh && lastFetch && now - lastFetch < CACHE_DURATION) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await bakeryApi.getItems(bakeryId);

      if (response.success && response.data) {
        set((state) => ({
          items: [
            ...state.items.filter((item) => item.bakeryId !== bakeryId),
            ...(response.data || []),
          ],
          lastFetchTime: {
            ...state.lastFetchTime,
            [bakeryId]: now,
          },
          isLoading: false,
        }));
      } else {
        set({
          error: response.message || "Failed to fetch bakery items",
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        isLoading: false,
      });
    }
  },

  getItemsByBakery: (bakeryId: string) => {
    return get().items.filter((item) => item.bakeryId === bakeryId);
  },

  updateItemStock: async (
    bakeryId: string,
    storeId: string,
    payload:
      | number
      | {
          stock: number;
          optionsStock?: Array<{
            optionId: string;
            stock: number;
            label?: string;
            value?: string;
            type?: string;
            imageUrl?: string | null;
          }>;
        },
  ) => {
    try {
      const response = await bakeryApi.updateItemStock(
        bakeryId,
        storeId,
        payload,
      );

      if (response.success && response.data) {
        const updatedData = response.data;
        set((state) => ({
          items: state.items.map((item) =>
            item.id === storeId
              ? {
                  ...item,
                  stock: updatedData.stock,
                  optionsStock: updatedData.optionsStock,
                }
              : item,
          ),
        }));
      } else {
        set({
          error: response.message || "Failed to update item stock",
        });
        throw new Error(response.message || "Failed to update stock");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      set({ error: errorMessage });
      throw error;
    }
  },

  clearItems: () => {
    set({
      items: [],
      lastFetchTime: {},
      error: null,
    });
  },
}));
