/**
 * Unassigned Orders Store — paginated feed for the admin orders sidebar.
 *
 * Backend-driven: every filter change refetches page 1 from
 * `GET /orders/unassigned`. Infinite scroll appends page 2, 3, … via
 * `fetchMore()`. The store owns the filter state so the UI never has to
 * re-derive lists locally.
 *
 * Results are cached per filter combination. Switching to a previously
 * loaded combination (e.g. flipping the type back to "small_cakes") is
 * instant — no refetch unless the cache entry is older than 5 minutes
 * or `reload({ force: true })` is called.
 */

import { create } from "zustand";
import type { Order } from "@/data/orders";
import {
  orderApi,
  type UnassignedOrdersFilters,
  type OrdersPagination,
} from "@/lib/services/order.service";
import { convertApiResponseToOrder } from "@/stores/orderStore";

export interface UnassignedFiltersState {
  regionId?: string;
  type?: string;
  q?: string;
  status?: string[];
  sort?: "asc" | "desc";
}

interface CacheEntry {
  orders: Order[];
  pagination: OrdersPagination;
  fetchedAt: number;
}

interface UnassignedOrdersState {
  orders: Order[];
  pagination: OrdersPagination | null;
  filters: UnassignedFiltersState;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  /** Cache keyed by the serialized filter combo. */
  cache: Record<string, CacheEntry>;
  currentKey: string;

  setFilters: (next: Partial<UnassignedFiltersState>) => void;
  /**
   * Switch to the current filters. Uses the cache if fresh, otherwise
   * fetches page 1 from the backend. Pass `{ force: true }` to bypass cache.
   */
  reload: (options?: { force?: boolean }) => Promise<void>;
  /** Append the next page if there is one. No-op if loading or at the end. */
  fetchMore: () => Promise<void>;
  /** Clear the cache (and current view). */
  invalidate: () => void;
  /** Insert an order at the top of the pool in memory (no refetch). */
  addOrder: (order: Order) => void;
  /**
   * Remove an order from the pool in memory (no refetch). Returns the removed
   * order so the caller can move it elsewhere / revert.
   */
  removeOrder: (orderId: string) => Order | undefined;
  reset: () => void;
}

const DEFAULT_LIMIT = 20;
const CACHE_TTL = 5 * 60 * 1000;

// Statuses considered "active" — the admin orders page hides cancelled,
// ready, out_for_delivery, and delivered. They live on the completed page.
const ACTIVE_STATUSES = ["pending", "confirmed", "preparing"] as const;

function effectiveStatuses(filters: UnassignedFiltersState): string[] {
  return filters.status && filters.status.length > 0
    ? filters.status
    : [...ACTIVE_STATUSES];
}

function buildApiFilters(
  filters: UnassignedFiltersState,
  page: number,
): UnassignedOrdersFilters {
  return {
    page,
    limit: DEFAULT_LIMIT,
    regionId: filters.regionId || undefined,
    type: filters.type || undefined,
    q: filters.q || undefined,
    status: effectiveStatuses(filters),
    sort: filters.sort,
  };
}

function makeCacheKey(filters: UnassignedFiltersState): string {
  return JSON.stringify({
    regionId: filters.regionId || "",
    type: filters.type || "",
    q: filters.q || "",
    status: [...effectiveStatuses(filters)].sort(),
    sort: filters.sort || "",
  });
}

export const useUnassignedOrdersStore = create<UnassignedOrdersState>(
  (set, get) => ({
    orders: [],
    pagination: null,
    filters: {},
    isLoading: false,
    isLoadingMore: false,
    error: null,
    cache: {},
    currentKey: makeCacheKey({}),

    setFilters: (next) => {
      set((state) => ({ filters: { ...state.filters, ...next } }));
      // Caller is expected to call reload() — keeps debouncing/wiring explicit.
    },

    reload: async ({ force = false } = {}) => {
      const state = get();
      const key = makeCacheKey(state.filters);
      const cached = state.cache[key];

      // Cache hit — swap the visible orders, no network call.
      if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        set({
          orders: cached.orders,
          pagination: cached.pagination,
          currentKey: key,
          isLoading: false,
          error: null,
        });
        return;
      }

      set({ isLoading: true, error: null, currentKey: key });
      try {
        const response = await orderApi.getUnassigned(
          buildApiFilters(state.filters, 1),
        );
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Failed to load unassigned orders",
          );
        }
        const orders = response.data.items.map(convertApiResponseToOrder);
        const pagination = response.data.pagination;

        // Bail out if filters changed underneath us while we were fetching —
        // a newer reload() will overwrite state anyway.
        if (makeCacheKey(get().filters) !== key) return;

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
        if (makeCacheKey(get().filters) !== key) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load unassigned orders";
        console.error("[UnassignedOrdersStore] reload error:", message);
        set({ error: message, isLoading: false });
      }
    },

    fetchMore: async () => {
      const state = get();
      if (state.isLoading || state.isLoadingMore) return;
      const pagination = state.pagination;
      if (!pagination) return;
      if (pagination.page >= pagination.totalPages) return;

      const key = state.currentKey;
      const nextPage = pagination.page + 1;
      set({ isLoadingMore: true, error: null });
      try {
        const response = await orderApi.getUnassigned(
          buildApiFilters(state.filters, nextPage),
        );
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Failed to load more unassigned orders",
          );
        }
        const more = response.data.items.map(convertApiResponseToOrder);

        // Drop the result if the filter combo changed while we were fetching.
        if (get().currentKey !== key) return;

        const combined = [...get().orders, ...more];
        const newPagination = response.data.pagination;

        set((s) => ({
          orders: combined,
          pagination: newPagination,
          isLoadingMore: false,
          cache: {
            ...s.cache,
            [key]: {
              orders: combined,
              pagination: newPagination,
              // Don't bump fetchedAt — additional pages don't refresh the TTL.
              fetchedAt: s.cache[key]?.fetchedAt ?? Date.now(),
            },
          },
        }));
      } catch (err) {
        if (get().currentKey !== key) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load more unassigned orders";
        console.error("[UnassignedOrdersStore] fetchMore error:", message);
        set({ error: message, isLoadingMore: false });
      }
    },

    invalidate: () => {
      set({ cache: {} });
    },

    addOrder: (order) => {
      set((state) => {
        if (state.orders.some((o) => o.id === order.id)) return state;
        const pooled = { ...order, assignedBakeryId: undefined };
        return {
          orders: [pooled, ...state.orders],
          pagination: state.pagination
            ? { ...state.pagination, total: state.pagination.total + 1 }
            : state.pagination,
          // Drop cached pages — the live `orders` list is now the source of
          // truth; other filter combos refetch lazily on the next switch.
          cache: {},
        };
      });
    },

    removeOrder: (orderId) => {
      let removed: Order | undefined;
      set((state) => {
        removed = state.orders.find((o) => o.id === orderId);
        if (!removed) return state;
        return {
          orders: state.orders.filter((o) => o.id !== orderId),
          pagination: state.pagination
            ? { ...state.pagination, total: Math.max(0, state.pagination.total - 1) }
            : state.pagination,
          cache: {},
        };
      });
      return removed;
    },

    reset: () => {
      set({
        orders: [],
        pagination: null,
        filters: {},
        isLoading: false,
        isLoadingMore: false,
        error: null,
        cache: {},
        currentKey: makeCacheKey({}),
      });
    },
  }),
);
