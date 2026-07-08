/**
 * Dispatch Store — backend-paginated feed for the admin driver-dispatch board.
 *
 * Lists bakery-assigned orders that aren't delivered/cancelled yet, so an admin
 * can assign a delivery driver. Mirrors the completed-orders store: each
 * (filter-combo, page) tuple is cached separately so paging/refiltering is
 * instant. Adds an `assignDriver` action that patches the affected order in
 * place (and across the cache) after the server confirms.
 */

import { create } from "zustand";
import {
  orderApi,
  type DispatchOrder,
  type DispatchOrdersFilters,
  type DispatchDriverState,
  type OrdersPagination,
} from "@/lib/services/order.service";

export interface DispatchFiltersState {
  regionId?: string;
  bakeryId?: string;
  q?: string;
  driverState?: DispatchDriverState;
  sort?: "asc" | "desc";
}

interface CacheEntry {
  items: DispatchOrder[];
  pagination: OrdersPagination;
  fetchedAt: number;
}

interface DispatchState {
  items: DispatchOrder[];
  pagination: OrdersPagination | null;
  filters: DispatchFiltersState;
  page: number;
  isLoading: boolean;
  error: string | null;

  cache: Record<string, CacheEntry>;
  currentKey: string;

  setFilters: (next: Partial<DispatchFiltersState>) => void;
  goToPage: (page: number) => Promise<void>;
  reload: (options?: { force?: boolean }) => Promise<void>;
  /**
   * Assign (driverId set) or unassign (driverId null) a driver to an order.
   * `driverName` is an optional hint so the chip can show the name before the
   * driver accepts. Throws on failure so the caller can surface it.
   */
  assignDriver: (
    orderId: string,
    driverId: string | null,
    driverName?: string | null,
  ) => Promise<void>;
  invalidate: () => void;
  reset: () => void;
}

const DEFAULT_LIMIT = 20;
const CACHE_TTL = 5 * 60 * 1000;

function makeCacheKey(filters: DispatchFiltersState, page: number): string {
  return JSON.stringify({
    regionId: filters.regionId || "",
    bakeryId: filters.bakeryId || "",
    q: filters.q || "",
    driverState: filters.driverState || "",
    sort: filters.sort || "",
    page,
  });
}

function buildApiFilters(
  filters: DispatchFiltersState,
  page: number,
): DispatchOrdersFilters {
  return {
    page,
    limit: DEFAULT_LIMIT,
    regionId: filters.regionId || undefined,
    bakeryId: filters.bakeryId || undefined,
    q: filters.q || undefined,
    driverState: filters.driverState || undefined,
    sort: filters.sort,
  };
}

/** Apply the local assignment change to a single order. */
function applyAssignment(
  order: DispatchOrder,
  driverId: string | null,
  driverName?: string | null,
): DispatchOrder {
  if (driverId === null) {
    return {
      ...order,
      driverId: null,
      driverData: null,
      driverAssignedAt: null,
      assignedDriverName: null,
    };
  }
  return {
    ...order,
    driverId,
    // Server clears driverData on (re)assign; it repopulates on acceptance.
    driverData: null,
    assignedDriverName: driverName ?? null,
  };
}

const initialKey = makeCacheKey({}, 1);

export const useDispatchStore = create<DispatchState>((set, get) => ({
  items: [],
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
        items: cached.items,
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
      const response = await orderApi.getDispatch(
        buildApiFilters(state.filters, page),
      );
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load dispatch orders");
      }
      const items = response.data.items;
      const pagination = response.data.pagination;

      // Drop the response if the user changed page/filters mid-flight.
      if (makeCacheKey(get().filters, get().page) !== key) return;

      set((s) => ({
        items,
        pagination,
        isLoading: false,
        cache: {
          ...s.cache,
          [key]: { items, pagination, fetchedAt: Date.now() },
        },
      }));
    } catch (err) {
      if (makeCacheKey(get().filters, get().page) !== key) return;
      const message =
        err instanceof Error ? err.message : "Failed to load dispatch orders";
      console.error("[DispatchStore] goToPage error:", message);
      set({ error: message, isLoading: false });
    }
  },

  reload: async ({ force = false } = {}) => {
    if (force) {
      get().invalidate();
    }
    set({ page: 1 });
    await get().goToPage(1);
  },

  assignDriver: async (orderId, driverId, driverName) => {
    const response = await orderApi.assignDriver(orderId, driverId);
    if (!response.success) {
      throw new Error(response.message || "Failed to assign driver");
    }

    // Patch the affected order in the visible list and everywhere in the cache
    // so paging back shows the updated assignment.
    set((s) => {
      const patch = (list: DispatchOrder[]) =>
        list.map((o) =>
          o.id === orderId ? applyAssignment(o, driverId, driverName) : o,
        );
      const cache: Record<string, CacheEntry> = {};
      for (const [k, entry] of Object.entries(s.cache)) {
        cache[k] = { ...entry, items: patch(entry.items) };
      }
      return { items: patch(s.items), cache };
    });
  },

  invalidate: () => {
    set({ cache: {} });
  },

  reset: () => {
    set({
      items: [],
      pagination: null,
      filters: {},
      page: 1,
      isLoading: false,
      error: null,
      cache: {},
      currentKey: initialKey,
    });
  },
}));
