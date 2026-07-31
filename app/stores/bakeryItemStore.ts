/**
 * Bakery Item Store (Zustand)
 *
 * This store manages bakery item stores data with API integration.
 * It handles fetching, caching, and mutations for bakery items.
 *
 * Items are keyed by bakeryId rather than held in one flat array. A flat array
 * let a stale response from bakery A land after bakery B's response and
 * reinstate rows the newer fetch had cleared, so a bakery whose API returned
 * `[]` still rendered another bakery's cards. Keying by id makes that class of
 * cross-bakery bleed structurally impossible.
 */

import { create } from "zustand";
import {
  bakeryApi,
  type Bakery,
  type BakeryItemStore,
} from "@/lib/services/bakery.service";
import { bakeryCarriesStock } from "@/lib/bakeryStock";

const EMPTY_ITEMS: BakeryItemStore[] = [];

/**
 * Counts items currently holding stock. Addons carry their quantity in
 * `optionsStock` rather than the top-level `stock`, so both are considered —
 * an addon with stocked options but `stock: 0` still counts as holding stock.
 */
export function countItemsWithStock(items: BakeryItemStore[]): number {
  return items.filter(
    (item) =>
      item.stock > 0 ||
      (item.optionsStock ?? []).some((option) => option.stock > 0),
  ).length;
}

interface BakeryItemStoreState {
  // Data — keyed by bakeryId so one bakery's rows can never surface under another
  itemsByBakery: Record<string, BakeryItemStore[]>;
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
  invalidate: () => void;
  invalidateBakery: (bakeryId: string) => void;
  refreshRegionBakeries: (regionId: string) => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-flight requests keyed by bakeryId. The cache check below is evaluated
// before any request resolves, so without this two concurrent callers (e.g. a
// route effect firing twice) would both issue a request and race on the result.
const inFlight = new Map<string, Promise<void>>();

export const useBakeryItemStore = create<BakeryItemStoreState>((set, get) => ({
  itemsByBakery: {},
  isLoading: false,
  error: null,
  lastFetchTime: {},

  fetchBakeryItems: async (bakeryId: string, forceRefresh = false) => {
    if (!bakeryId) return;

    const state = get();
    const lastFetch = state.lastFetchTime[bakeryId];
    const now = Date.now();

    // Check if we have cached data and it's still fresh
    if (!forceRefresh && lastFetch && now - lastFetch < CACHE_DURATION) {
      return;
    }

    // Reuse an outstanding request for the same bakery instead of racing it
    const pending = inFlight.get(bakeryId);
    if (pending && !forceRefresh) return pending;

    set({ isLoading: true, error: null });

    const request = (async () => {
      try {
        const response = await bakeryApi.getItems(bakeryId);

        if (response.success) {
          // An empty list is a valid answer: it must clear this bakery's rows,
          // never fall through and leave whatever was there before.
          const rows = response.data ?? [];

          // Guard against a mislabelled payload writing rows under the wrong key
          const scoped = rows.filter(
            (item) => !item.bakeryId || item.bakeryId === bakeryId,
          );

          set((s) => ({
            itemsByBakery: { ...s.itemsByBakery, [bakeryId]: scoped },
            lastFetchTime: { ...s.lastFetchTime, [bakeryId]: Date.now() },
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
      } finally {
        inFlight.delete(bakeryId);
      }
    })();

    inFlight.set(bakeryId, request);
    return request;
  },

  getItemsByBakery: (bakeryId: string) => {
    return get().itemsByBakery[bakeryId] ?? EMPTY_ITEMS;
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
        set((state) => {
          const current = state.itemsByBakery[bakeryId];
          if (!current) return state;
          return {
            itemsByBakery: {
              ...state.itemsByBakery,
              [bakeryId]: current.map((item) =>
                item.id === storeId
                  ? {
                      ...item,
                      stock: updatedData.stock,
                      optionsStock: updatedData.optionsStock,
                    }
                  : item,
              ),
            },
          };
        });
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
    inFlight.clear();
    set({
      itemsByBakery: {},
      lastFetchTime: {},
      error: null,
    });
  },

  invalidate: () => {
    inFlight.clear();
    set({ lastFetchTime: {} });
  },

  /**
   * Drops one bakery's cached items and its cache timestamp, so the next read
   * refetches. Unlike `invalidate`, this clears the rows too — after a type
   * change the previous items may no longer be valid for the bakery, and
   * leaving them in place would render stale cards until the fetch resolves.
   */
  invalidateBakery: (bakeryId: string) => {
    inFlight.delete(bakeryId);
    set((state) => {
      const itemsByBakery = { ...state.itemsByBakery };
      const lastFetchTime = { ...state.lastFetchTime };
      delete itemsByBakery[bakeryId];
      delete lastFetchTime[bakeryId];
      return { itemsByBakery, lastFetchTime };
    });
  },

  /**
   * Force-refetches item stores for every stock-carrying bakery in a region.
   * Adding a region item price (addon/sweet/featured-cake) seeds a `stock: 0`
   * row for each of those bakeries server-side; calling this afterward writes
   * the fresh rows into this store so any bakery detail page already mounted
   * (subscribed via `itemsByBakery[id]`) picks up the new item live, without
   * whoever triggered the price change needing to know who's viewing what.
   */
  refreshRegionBakeries: async (regionId: string) => {
    try {
      const response = await bakeryApi.getAll();
      if (!response.success || !response.data) return;

      const raw = response.data as unknown;
      const bakeries: Bakery[] = Array.isArray(raw)
        ? raw
        : ((raw as { items?: Bakery[] })?.items ?? []);

      const targetIds = bakeries
        .filter((b) => b.regionId === regionId && bakeryCarriesStock(b.types))
        .map((b) => b.id);

      await Promise.all(
        targetIds.map((bakeryId) => get().fetchBakeryItems(bakeryId, true)),
      );
    } catch (error) {
      console.error("Failed to refresh bakery stock for region:", error);
    }
  },
}));
