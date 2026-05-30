/**
 * Assigned Orders Store — backend feed for the admin Kanban view.
 *
 * Hits `GET /orders/assigned` and stores orders grouped by bakeryId,
 * exactly as the API returns them. The frontend never recomputes the
 * grouping client-side.
 */

import { create } from "zustand";
import type { Order } from "@/data/orders";
import {
  orderApi,
  type AssignedOrdersFilters,
} from "@/lib/services/order.service";
import { convertApiResponseToOrder } from "@/stores/orderStore";

export interface AssignedFiltersState {
  q?: string;
  status?: string[];
  sort?: "asc" | "desc";
}

interface AssignedOrdersState {
  ordersByBakery: Record<string, Order[]>;
  filters: AssignedFiltersState;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  setFilters: (next: Partial<AssignedFiltersState>) => void;
  reload: () => Promise<void>;
  reset: () => void;
}

const EMPTY: Record<string, Order[]> = {};

// Statuses considered "active" — the admin orders page only deals with these.
// ready / out_for_delivery / delivered / cancelled live on the completed-orders
// page and should never appear here, even if the UI doesn't apply an explicit
// status filter.
const ACTIVE_STATUSES = ["pending", "confirmed", "preparing"] as const;

function buildApiFilters(filters: AssignedFiltersState): AssignedOrdersFilters {
  return {
    q: filters.q || undefined,
    status:
      filters.status && filters.status.length > 0
        ? filters.status
        : [...ACTIVE_STATUSES],
    sort: filters.sort,
  };
}

export const useAssignedOrdersStore = create<AssignedOrdersState>(
  (set, get) => ({
    ordersByBakery: EMPTY,
    filters: {},
    isLoading: false,
    error: null,
    lastFetchTime: null,

    setFilters: (next) => {
      set((state) => ({ filters: { ...state.filters, ...next } }));
    },

    reload: async () => {
      const state = get();
      set({ isLoading: true, error: null });
      try {
        const response = await orderApi.getAssigned(
          buildApiFilters(state.filters),
        );
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Failed to load assigned orders",
          );
        }

        const out: Record<string, Order[]> = {};
        for (const [bakeryId, list] of Object.entries(response.data)) {
          out[bakeryId] = (list || []).map(convertApiResponseToOrder);
        }

        set({
          ordersByBakery: out,
          isLoading: false,
          lastFetchTime: Date.now(),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load assigned orders";
        console.error("[AssignedOrdersStore] reload error:", message);
        set({ error: message, isLoading: false });
      }
    },

    reset: () => {
      set({
        ordersByBakery: EMPTY,
        filters: {},
        isLoading: false,
        error: null,
        lastFetchTime: null,
      });
    },
  }),
);
