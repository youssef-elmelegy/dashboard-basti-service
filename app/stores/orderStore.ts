/**
 * Order Store (Zustand)
 *
 * Manages order data globally with caching.
 *
 * Features:
 * - Single API call, cached across all pages
 * - Ready for real API integration
 * - Works with bakery/chef stores for filtering
 */

import { create } from "zustand";
import { ORDERS_DATA, type Order } from "@/data/orders";

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  getRegions: () => string[];
  getOrderById: (id: string) => Order | undefined;
  fetchOrders: () => Promise<void>;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  resetOrders: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: ORDERS_DATA,
  isLoading: false,
  error: null,

  getRegions: () => {
    return Array.from(new Set(get().orders.map((o) => o.region)));
  },

  getOrderById: (id: string) => {
    return get().orders.find((o) => o.id === id);
  },

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API when ready
      // const response = await fetch('/api/orders');
      // const data = await response.json();
      const data = ORDERS_DATA;
      set({ orders: data, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch orders";
      set({ error: errorMessage, isLoading: false });
    }
  },

  addOrder: (order: Order) => {
    set((state) => ({ orders: [...state.orders, order] }));
  },

  updateOrder: (id: string, updates: Partial<Order>) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  },

  deleteOrder: (id: string) => {
    set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
  },

  resetOrders: () => {
    set({ orders: ORDERS_DATA, isLoading: false, error: null });
  },
}));
