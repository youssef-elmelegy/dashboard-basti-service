/**
 * Order Store (Zustand)
 *
 * Manages order data globally with filtering and caching.
 *
 * Features:
 * - API integration with order fetching
 * - Filter management (status, regionId)
 * - Real-time updates via updateOrder
 * - Works with bakery/chef stores for filtering
 */

import { create } from "zustand";
import { ORDERS_DATA, type Order, type OrderItem } from "@/data/orders";
import {
  orderApi,
  type OrderResponse,
  type OrderFilters,
} from "@/lib/services/order.service";

interface OrderFiltersState {
  status?: string[];
  regionId?: string;
}

interface OrderState {
  // Data
  orders: Order[];
  isLoading: boolean;
  error: string | null;

  // Filters
  filters: OrderFiltersState;
  lastFetchTime: number | null;

  // Bakery orders cache
  bakeryOrdersCache: Record<string, { orders: Order[]; timestamp: number }>;

  // Detailed orders cache (for full order details from API)
  detailedOrdersCache: Record<string, { data: any; timestamp: number }>;

  // Actions
  getRegions: () => string[];
  getOrderById: (id: string) => Order | undefined;
  getDetailedOrder: (id: string) => any | undefined;
  cacheDetailedOrder: (id: string, orderData: any) => void;
  fetchOrders: (filters?: OrderFilters) => Promise<void>;
  fetchBakeryOrders: (
    bakeryId: string,
    forceRefresh?: boolean,
  ) => Promise<Order[]>;
  setFilters: (filters: OrderFiltersState) => void;
  clearFilters: () => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  resetOrders: () => void;
  clearError: () => void;
}

const ORDER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Convert API response to internal Order format
 */
function convertApiResponseToOrder(apiOrder: OrderResponse): Order {
  // Helper to normalize selectedOptions coming from API
  function parseSelectedOptions(value: unknown): OrderItem["selectedOptions"] {
    if (!value) return undefined;
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (!Array.isArray(parsed)) return undefined;

      return parsed.map((opt) => {
        const o = opt as Record<string, unknown>;
        return {
          type: typeof o.type === "string" ? o.type : "",
          label: typeof o.label === "string" ? o.label : "",
          value: typeof o.value === "string" ? o.value : "",
          imageUrl:
            typeof o.imageUrl === "string"
              ? o.imageUrl
              : typeof o.image === "string"
              ? o.image
              : "",
          optionId:
            typeof o.optionId === "string"
              ? o.optionId
              : typeof o.id === "string"
              ? o.id
              : "",
        };
      });
    } catch (e) {
      return undefined;
    }
  }
  // Combine and normalize items from different categories
    const normalizeItem = (it: Record<string, unknown>, type: OrderItem["type"]) => ({
      ...(it as Record<string, unknown>),
      type,
      selectedOptions: parseSelectedOptions(
        (it["selectedOptions"] ?? it["selected_options"] ?? undefined),
      ),
    });

    const orderItems = [
      ...(apiOrder.addons || []).map((it) =>
        normalizeItem(it as unknown as Record<string, unknown>, "addon"),
      ),
      ...(apiOrder.sweets || []).map((it) =>
        normalizeItem(it as unknown as Record<string, unknown>, "sweet"),
      ),
      ...(apiOrder.featuredCakes || []).map((it) =>
        normalizeItem(it as unknown as Record<string, unknown>, "featured_cake"),
      ),
      ...(apiOrder.predesignedCakes || []).map((it) =>
        normalizeItem(it as unknown as Record<string, unknown>, "predesigned_cake"),
      ),
      ...(apiOrder.customCakes || []).map((it) =>
        normalizeItem(it as unknown as Record<string, unknown>, "custom_cake"),
      ),
    ];

  // Get first featured cake image safely
  const featuredCakesArray = Array.isArray(apiOrder.featuredCakes)
    ? apiOrder.featuredCakes
    : [];
  const firstFeaturedImage =
    featuredCakesArray.length > 0 &&
    featuredCakesArray[0]?.data?.images &&
    Array.isArray(featuredCakesArray[0].data.images) &&
    featuredCakesArray[0].data.images[0]
      ? (featuredCakesArray[0].data.images[0] as string)
      : "";

  // Map cartType to local Order.type union
  const allowedTypes = ["big_cakes", "small_cakes", "others"] as const;
  const cartType = (apiOrder.cartType || "basket_cakes").toString();
  const mappedType = (allowedTypes.includes(
    cartType as unknown as (typeof allowedTypes)[number],
  )
    ? (cartType as (typeof allowedTypes)[number])
    : "big_cakes") as Order["type"];

  // Map orderStatus to local Order.status union
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
    customerName:
      apiOrder.userData?.firstName + " " + apiOrder.userData?.lastName,
    customerPhone: apiOrder.userData?.phoneNumber,
    customerEmail: apiOrder.userData?.email,
    type: mappedType,
    productName: apiOrder.cartType || "Custom Order",
    productImage: firstFeaturedImage,
    basePrice: apiOrder.totalPrice,
    totalPrice: apiOrder.finalPrice,
    deliveryLocation: apiOrder.locationData?.description || "",
    region: apiOrder.regionName,
    deliverDay: apiOrder.willDeliverAt,
    orderedAt: apiOrder.createdAt,
    status: mappedStatus,
    capacitySlots: apiOrder.totalCapacity,
    assignedBakeryId: apiOrder.bakeryId || undefined,
    specialRequests: apiOrder.deliveryNote || undefined,
    deliveryNote: apiOrder.deliveryNote || undefined,
    keepAnonymous: apiOrder.keepAnonymous,
    deliveryLatitude: apiOrder.locationData?.latitude,
    deliveryLongitude: apiOrder.locationData?.longitude,
    // Include all order items
    orderItems: orderItems as OrderItem[],
    // Derive typed category lists from normalized orderItems
    addons: orderItems.filter((it) => it.type === "addon") as OrderItem[],
    sweets: orderItems.filter((it) => it.type === "sweet") as OrderItem[],
    featuredCakes: orderItems.filter(
      (it) => it.type === "featured_cake",
    ) as OrderItem[],
    predesignedCakes: orderItems.filter(
      (it) => it.type === "predesigned_cake",
    ) as OrderItem[],
    customCakes: orderItems.filter(
      (it) => it.type === "custom_cake",
    ) as OrderItem[],
    // Card details - parse from JSON strings
    cardMessage: apiOrder.cardMessage
      ? (() => {
          try {
            const parsed =
              typeof apiOrder.cardMessage === "string"
                ? JSON.parse(apiOrder.cardMessage)
                : apiOrder.cardMessage;
            return {
              to: parsed.to,
              from: parsed.from,
              message: parsed.message,
            };
          } catch {
            return undefined;
          }
        })()
      : undefined,
    recipientData: apiOrder.recipientData
      ? (() => {
          try {
            const parsed =
              typeof apiOrder.recipientData === "string"
                ? JSON.parse(apiOrder.recipientData)
                : apiOrder.recipientData;
            return {
              name: parsed.name,
              email: parsed.email,
              phoneNumber: parsed.phoneNumber,
            };
          } catch {
            return undefined;
          }
        })()
      : undefined,
  };
}

export const useOrderStore = create<OrderState>((set, get) => ({
  // Initial state
  orders: [],
  isLoading: false,
  error: null,
  filters: {},
  lastFetchTime: null,
  bakeryOrdersCache: {},
  detailedOrdersCache: {},

  // Actions
  getRegions: () => {
    return Array.from(new Set(get().orders.map((o) => o.region)));
  },

  getOrderById: (id: string) => {
    return get().orders.find((o) => o.id === id);
  },

  /**
   * Get detailed order from cache
   * Returns undefined if not cached or cache is stale
   */
  getDetailedOrder: (id: string) => {
    const state = get();
    const cached = state.detailedOrdersCache[id];
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < ORDER_CACHE_DURATION) {
        console.log(`[Order Store] Using cached detailed order for ${id}`);
        return cached.data;
      }
    }
    return undefined;
  },

  /**
   * Cache detailed order information
   */
  cacheDetailedOrder: (id: string, orderData: any) => {
    set((state) => ({
      detailedOrdersCache: {
        ...state.detailedOrdersCache,
        [id]: {
          data: orderData,
          timestamp: Date.now(),
        },
      },
    }));
  },

  /**
   * Fetch bakery-specific orders with caching
   * Stores orders in cache to avoid refetching when navigating back
   */
  fetchBakeryOrders: async (
    bakeryId: string,
    forceRefresh: boolean = false,
  ) => {
    const state = get();
    const now = Date.now();
    const cacheKey = bakeryId;

    // Check if we have cached data and it's not stale
    if (!forceRefresh && state.bakeryOrdersCache[cacheKey]) {
      const cached = state.bakeryOrdersCache[cacheKey];
      if (now - cached.timestamp < ORDER_CACHE_DURATION) {
        console.log(`[Order Store] Using cached bakery orders for ${bakeryId}`);
        return cached.orders;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const statuses = [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
      ];

      const response = await orderApi.getBakeryOrders(bakeryId, {
        status: statuses,
      });

      if (response.success && response.data) {
        // Convert API responses to internal Order format
        const bakeryOrdersList = response.data.map((apiOrder: OrderResponse) =>
          convertApiResponseToOrder(apiOrder),
        );

        // Cache the bakery orders
        set((state) => ({
          bakeryOrdersCache: {
            ...state.bakeryOrdersCache,
            [cacheKey]: {
              orders: bakeryOrdersList,
              timestamp: now,
            },
          },
          isLoading: false,
        }));

        return bakeryOrdersList;
      } else {
        throw new Error(response.message || "Failed to fetch bakery orders");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch bakery orders";
      console.error("[Order Store] Fetch bakery orders error:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      return [];
    }
  },

  /**
   * Fetch orders from API with optional filters
   * Implements caching to avoid noisy refetches
   */
  fetchOrders: async (filters?: OrderFilters) => {
    const state = get();
    const now = Date.now();
    const filterKey = JSON.stringify(filters || {});

    // Check if we have cached data for the same filters
    if (
      state.orders.length > 0 &&
      state.lastFetchTime &&
      now - state.lastFetchTime < ORDER_CACHE_DURATION
    ) {
      // If filters are the same, use cached data
      const lastFiltersKey = JSON.stringify(state.filters || {});
      if (filterKey === lastFiltersKey) {
        console.log("[Order Store] Using cached orders");
        return;
      }
    }

    set({ isLoading: true, error: null });
    try {
      const response = await orderApi.getAll(filters);

      if (response.success && response.data) {
        // Convert API responses to internal Order format
        const convertedOrders = response.data.map(convertApiResponseToOrder);
        set({
          orders: convertedOrders,
          isLoading: false,
          filters: filters || {},
          lastFetchTime: now,
        });
      } else {
        throw new Error(response.message || "Failed to fetch orders");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch orders";
      console.error("[Order Store] Fetch error:", errorMessage);
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Set active filters and refetch orders
   */
  setFilters: (newFilters: OrderFiltersState) => {
    set({ filters: newFilters });
    // Trigger refetch with new filters
    get().fetchOrders(newFilters);
  },

  /**
   * Clear all filters
   */
  clearFilters: () => {
    set({ filters: {} });
    get().fetchOrders();
  },

  /**
   * Add new order to the list
   */
  addOrder: (order: Order) => {
    set((state) => ({ orders: [...state.orders, order] }));
  },

  /**
   * Update existing order (e.g., bakery assignment)
   */
  updateOrder: (id: string, updates: Partial<Order>) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  },

  /**
   * Delete order from list
   */
  deleteOrder: (id: string) => {
    set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
  },

  /**
   * Reset to mock data
   */
  resetOrders: () => {
    set({ orders: ORDERS_DATA, isLoading: false, error: null, filters: {} });
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));
