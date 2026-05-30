/**
 * Completed Orders Store — backend-paginated feed for the admin
 * completed-orders table.
 *
 * Cache structure: each (filter-combo, page) tuple is cached separately so
 * paging back and forth, or revisiting a region you've already loaded, is
 * instant. The store owns the filter state, the current page, and the
 * pagination metadata; the page only reads what's currently visible.
 */

import { create } from "zustand";
import type { Order } from "@/data/orders";
import {
  orderApi,
  type CompletedOrdersFilters,
  type OrdersPagination,
} from "@/lib/services/order.service";
import { convertApiResponseToOrder } from "@/stores/orderStore";

export interface CompletedFiltersState {
  regionId?: string;
  q?: string;
  status?: string[];
  sort?: "asc" | "desc";
}

interface CacheEntry {
  orders: Order[];
  pagination: OrdersPagination;
  fetchedAt: number;
}

interface CompletedOrdersState {
  orders: Order[];
  pagination: OrdersPagination | null;
  filters: CompletedFiltersState;
  page: number;
  isLoading: boolean;
  error: string | null;

  cache: Record<string, CacheEntry>;
  currentKey: string;

  setFilters: (next: Partial<CompletedFiltersState>) => void;
  /** Switch to a specific page of the current filter combo. */
  goToPage: (page: number) => Promise<void>;
  /** Reload page 1 — useful when filters change or on explicit refresh. */
  reload: (options?: { force?: boolean }) => Promise<void>;
  /** Clear the entire cache (e.g. after an order state change elsewhere). */
  invalidate: () => void;
  reset: () => void;
}

const DEFAULT_LIMIT = 20;
const CACHE_TTL = 5 * 60 * 1000;

function makeCacheKey(filters: CompletedFiltersState, page: number): string {
  return JSON.stringify({
    regionId: filters.regionId || "",
    q: filters.q || "",
    status:
      filters.status && filters.status.length > 0
        ? [...filters.status].sort()
        : [],
    sort: filters.sort || "",
    page,
  });
}

function buildApiFilters(
  filters: CompletedFiltersState,
  page: number,
): CompletedOrdersFilters {
  return {
    page,
    limit: DEFAULT_LIMIT,
    regionId: filters.regionId || undefined,
    q: filters.q || undefined,
    status:
      filters.status && filters.status.length > 0 ? filters.status : undefined,
    sort: filters.sort,
  };
}

const initialKey = makeCacheKey({}, 1);

export const useCompletedOrdersStore = create<CompletedOrdersState>(
  (set, get) => ({
    orders: [],
    pagination: null,
    filters: {},
    page: 1,
    isLoading: false,
    error: null,
    cache: {},
    currentKey: initialKey,

    setFilters: (next) => {
      set((state) => ({ filters: { ...state.filters, ...next } }));
    },

    goToPage: async (page) => {
      const state = get();
      if (page < 1) return;
      const key = makeCacheKey(state.filters, page);
      const cached = state.cache[key];

      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        set({
          orders: cached.orders,
          pagination: cached.pagination,
          page,
          currentKey: key,
          isLoading: false,
          error: null,
        });
        return;
      }

      set({ isLoading: true, error: null, currentKey: key, page });
      try {
        const response = await orderApi.getCompleted(
          buildApiFilters(state.filters, page),
        );
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Failed to load completed orders",
          );
        }
        const orders = response.data.items.map(convertApiResponseToOrder);
        const pagination = response.data.pagination;

        // Drop the response if the user changed page/filters mid-flight.
        if (makeCacheKey(get().filters, get().page) !== key) return;

        set((s) => ({
          orders,
          pagination,
          isLoading: false,
          cache: {
            ...s.cache,
            [key]: { orders, pagination, fetchedAt: Date.now() },
          },
        }));
      } catch (err) {
        if (makeCacheKey(get().filters, get().page) !== key) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load completed orders";
        console.error("[CompletedOrdersStore] goToPage error:", message);
        set({ error: message, isLoading: false });
      }
    },

    reload: async ({ force = false } = {}) => {
      if (force) {
        set({ cache: {} });
      }
      set({ page: 1 });
      await get().goToPage(1);
    },

    invalidate: () => {
      set({ cache: {} });
    },

    reset: () => {
      set({
        orders: [],
        pagination: null,
        filters: {},
        page: 1,
        isLoading: false,
        error: null,
        cache: {},
        currentKey: initialKey,
      });
    },
  }),
);
