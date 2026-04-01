import { create } from "zustand";
import type { Order, OrderItem as LocalOrderItem } from "@/data/orders";
import {
  orderApi,
  type OrderResponse,
  type OrderFilters,
  type OrderItem as ApiOrderItem,
} from "@/lib/services/order.service";

interface CompletedOrdersState {
  // Data
  orders: Order[];
  isLoading: boolean;
  error: string | null;

  // Cache management
  lastFetchTime: number | null;

  // Actions
  getOrderById: (id: string) => Order | undefined;
  fetchCompletedOrders: (forceRefresh?: boolean) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  resetOrders: () => void;
  clearError: () => void;
}

const COMPLETED_ORDERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Convert API response to internal Order format
 */
function convertApiResponseToOrder(apiOrder: OrderResponse): Order {
  // Helper to map API OrderItem -> local OrderItem shape
  const mapApiItem = (it: ApiOrderItem): LocalOrderItem => {
    let selectedOptions: LocalOrderItem["selectedOptions"] | undefined =
      undefined;

    if (typeof it.selectedOptions === "string" && it.selectedOptions) {
      try {
        const parsed = JSON.parse(it.selectedOptions) as unknown;
        if (Array.isArray(parsed)) {
          selectedOptions = parsed.map((opt) => {
            const o = opt as Record<string, unknown>;
            return {
              type: typeof o.type === "string" ? o.type : "",
              label: typeof o.label === "string" ? o.label : "",
              value: typeof o.value === "string" ? o.value : "",
              imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : "",
              optionId: typeof o.optionId === "string" ? o.optionId : "",
            };
          });
        }
      } catch {
        selectedOptions = undefined;
      }
    }

    return {
      id: it.id,
      orderId: (it.orderId ?? "") as unknown as string,
      addonId: it.addonId ?? null,
      sweetId: it.sweetId ?? null,
      predesignedCakeId: it.predesignedCakeId ?? null,
      featuredCakeId: it.featuredCakeId ?? null,
      customCake: it.customCake ?? null,
      quantity: it.quantity,
      size: it.size ?? null,
      flavor: it.flavor ?? null,
      price: it.price,
      selectedOptions: selectedOptions,
      createdAt: it.createdAt,
      updatedAt: it.updatedAt,
      data: it.data,
    } as LocalOrderItem;
  };

  // Map cartType to local OrderType union
  const allowedTypes = ["big_cakes", "small_cakes", "others"] as const;
  const cartType = (apiOrder.cartType || "big_cakes").toString();
  const mappedType = (
    allowedTypes.includes(cartType as unknown as (typeof allowedTypes)[number])
      ? (cartType as (typeof allowedTypes)[number])
      : "big_cakes"
  ) as Order["type"];

  // Map orderStatus to local OrderStatus (fallback to 'pending')
  const allowedStatuses: Order["status"][] = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];
  const statusStr = (apiOrder.orderStatus || "pending").toString();
  const mappedStatus = allowedStatuses.includes(
    statusStr as unknown as (typeof allowedStatuses)[number],
  )
    ? (statusStr as Order["status"])
    : ("pending" as Order["status"]);

  return {
    id: apiOrder.id,
    referenceNumber: apiOrder.referenceNumber,
    customerName: `${apiOrder.userData.firstName} ${apiOrder.userData.lastName}`,
    customerPhone: apiOrder.userData.phoneNumber || undefined,
    customerEmail: apiOrder.userData.email || undefined,
    type: mappedType,
    productName: "Custom Order",
    productImage: "",
    basePrice: apiOrder.totalPrice,
    totalPrice: apiOrder.finalPrice,
    deliveryLocation: apiOrder.locationData?.description || "",
    region: apiOrder.regionName,
    deliverDay: apiOrder.wantedDeliveryDate || apiOrder.willDeliverAt,
    orderedAt: apiOrder.createdAt,
    status: mappedStatus,
    deliveredAt: apiOrder.deliveredAt || undefined,
    capacitySlots: apiOrder.totalCapacity,
    assignedBakeryId: apiOrder.bakeryId || undefined,
    deliveryLatitude: apiOrder.locationData?.latitude,
    deliveryLongitude: apiOrder.locationData?.longitude,
    orderItems: (apiOrder.addons || []).map(mapApiItem),
    addons: (apiOrder.addons || []).map(mapApiItem),
    sweets: (apiOrder.sweets || []).map(mapApiItem),
    featuredCakes: (apiOrder.featuredCakes || []).map(mapApiItem),
    predesignedCakes: (apiOrder.predesignedCakes || []).map(mapApiItem),
    customCakes: (apiOrder.customCakes || []).map(mapApiItem),
  };
}

export const useCompletedOrdersStore = create<CompletedOrdersState>(
  (set, get) => ({
    // Initial state
    orders: [],
    isLoading: false,
    error: null,
    lastFetchTime: null,

    // Actions
    getOrderById: (id: string) => {
      return get().orders.find((o) => o.id === id);
    },

    /**
     * Fetch completed orders from API with caching
     * Only refetches if cache is stale (> 5 minutes) or forceRefresh is true
     */
    fetchCompletedOrders: async (forceRefresh: boolean = false) => {
      const state = get();
      const now = Date.now();

      // Check if we have cached data and it's not stale
      if (!forceRefresh && state.lastFetchTime) {
        if (now - state.lastFetchTime < COMPLETED_ORDERS_CACHE_DURATION) {
          console.log("[Completed Orders Store] Using cached completed orders");
          return;
        }
      }

      set({ isLoading: true, error: null });
      try {
        // Fetch orders with completed statuses
        const filters: OrderFilters = {
          status: ["ready", "out_for_delivery", "delivered", "cancelled"],
        };

        const response = await orderApi.getAll(filters);

        if (response.success && response.data) {
          // Convert API responses to internal Order format
          const convertedOrders = response.data.map(convertApiResponseToOrder);

          set({
            orders: convertedOrders,
            isLoading: false,
            lastFetchTime: now,
          });
        } else {
          throw new Error(
            response.message || "Failed to fetch completed orders",
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch completed orders";
        console.error("[Completed Orders Store] Fetch error:", errorMessage);
        set({ error: errorMessage, isLoading: false });
      }
    },

    /**
     * Update existing order
     */
    updateOrder: (id: string, updates: Partial<Order>) => {
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, ...updates } : o,
        ),
      }));
    },

    /**
     * Delete order from list
     */
    deleteOrder: (id: string) => {
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
      }));
    },

    /**
     * Reset orders
     */
    resetOrders: () => {
      set({ orders: [], lastFetchTime: null });
    },

    /**
     * Clear error message
     */
    clearError: () => {
      set({ error: null });
    },
  }),
);
