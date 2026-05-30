/**
 * Bakery Completed Orders Store — backend-paginated feed for the manager
 * completed-orders page.
 *
 * Mirrors `completedOrdersStore`: cache is keyed by `(bakeryId, q, sort, page)`,
 * so paging back and forth or revisiting a previous search is instant for
 * up to 5 minutes.
 */

import { create } from "zustand";
import {
  orderApi,
  type OrderResponse,
  type OrdersPagination,
} from "@/lib/services/order.service";

const CACHE_TTL = 5 * 60 * 1000;
const DEFAULT_LIMIT = 20;
const COMPLETED_STATUSES = [
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export interface BakeryCompletedFiltersState {
  q?: string;
  sort?: "asc" | "desc";
}

interface CacheEntry {
  orders: OrderResponse[];
  pagination: OrdersPagination;
  fetchedAt: number;
}

interface BakeryCompletedOrdersState {
  orders: OrderResponse[];
  pagination: OrdersPagination | null;
  filters: BakeryCompletedFiltersState;
  page: number;
  currentBakeryId: string | null;
  isLoading: boolean;
  error: string | null;

  cache: Record<string, CacheEntry>;
  currentKey: string;

  setFilters: (next: Partial<BakeryCompletedFiltersState>) => void;
  /** Switch to a specific page for the given bakery. */
  goToPage: (bakeryId: string, page: number) => Promise<void>;
  /** Reload page 1 — call on mount, filter change, or explicit refresh. */
  reload: (bakeryId: string, options?: { force?: boolean }) => Promise<void>;
  invalidate: (bakeryId?: string) => void;
  reset: () => void;
}

function makeCacheKey(
  bakeryId: string,
  filters: BakeryCompletedFiltersState,
  page: number,
): string {
  return JSON.stringify({
    bakeryId,
    q: filters.q || "",
    sort: filters.sort || "",
    page,
  });
}

const EMPTY_ORDERS: OrderResponse[] = [];

export const useBakeryCompletedOrdersStore = create<BakeryCompletedOrdersState>(
  (set, get) => ({
    orders: EMPTY_ORDERS,
    pagination: null,
    filters: {},
    page: 1,
    currentBakeryId: null,
    isLoading: false,
    error: null,
    cache: {},
    currentKey: "",

    setFilters: (next) => {
      set((state) => ({ filters: { ...state.filters, ...next } }));
    },

    goToPage: async (bakeryId, page) => {
      if (page < 1) return;
      const state = get();
      const key = makeCacheKey(bakeryId, state.filters, page);
      const cached = state.cache[key];

      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        set({
          orders: cached.orders,
          pagination: cached.pagination,
          page,
          currentBakeryId: bakeryId,
          currentKey: key,
          isLoading: false,
          error: null,
        });
        return;
      }

      set({
        isLoading: true,
        error: null,
        page,
        currentBakeryId: bakeryId,
        currentKey: key,
      });

      try {
        const response = await orderApi.getBakeryOrders(bakeryId, {
          page,
          limit: DEFAULT_LIMIT,
          status: COMPLETED_STATUSES,
          q: state.filters.q || undefined,
          sort: state.filters.sort,
        });
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Failed to load completed bakery orders",
          );
        }

        // Drop the response if the user changed page/filters/bakery mid-flight.
        const after = get();
        if (
          makeCacheKey(
            after.currentBakeryId ?? bakeryId,
            after.filters,
            after.page,
          ) !== key
        ) {
          return;
        }

        set((s) => ({
          orders: response.data!.items,
          pagination: response.data!.pagination,
          isLoading: false,
          cache: {
            ...s.cache,
            [key]: {
              orders: response.data!.items,
              pagination: response.data!.pagination,
              fetchedAt: Date.now(),
            },
          },
        }));
      } catch (err) {
        const after = get();
        if (
          makeCacheKey(
            after.currentBakeryId ?? bakeryId,
            after.filters,
            after.page,
          ) !== key
        ) {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load completed bakery orders";
        console.error("[BakeryCompletedOrdersStore] goToPage error:", message);
        set({ error: message, isLoading: false });
      }
    },

    reload: async (bakeryId, { force = false } = {}) => {
      if (force) {
        set({ cache: {} });
      }
      set({ page: 1, currentBakeryId: bakeryId });
      await get().goToPage(bakeryId, 1);
    },

    invalidate: (bakeryId) => {
      if (!bakeryId) {
        set({ cache: {} });
        return;
      }
      set((s) => {
        const next: Record<string, CacheEntry> = {};
        for (const [k, v] of Object.entries(s.cache)) {
          try {
            const parsed = JSON.parse(k) as { bakeryId?: string };
            if (parsed.bakeryId !== bakeryId) next[k] = v;
          } catch {
            next[k] = v;
          }
        }
        return { cache: next };
      });
    },

    reset: () => {
      set({
        orders: EMPTY_ORDERS,
        pagination: null,
        filters: {},
        page: 1,
        currentBakeryId: null,
        isLoading: false,
        error: null,
        cache: {},
        currentKey: "",
      });
    },
  }),
);
