/**
 * Order API Service
 * Handles all order-related API calls
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

/**
 * Order item type definition
 */
export interface OrderItem {
  id: string;
  orderId: string;
  addonId: string | null;
  sweetId: string | null;
  predesignedCakeId: string | null;
  featuredCakeId: string | null;
  customCake: string | null;
  quantity: number;
  size: string | null;
  flavor: string | null;
  price: number;
  selectedOptions: string | null;
  createdAt: string;
  updatedAt: string;
  data?: Record<string, unknown>;
}

/**
 * Order QA data type definition
 */
export interface OrderQA {
  notes: string[];
  finalImages: string[];
}

/**
 * Order response type definition
 */
export interface OrderResponse {
  id: string;
  referenceNumber: string;
  userId: string | null;
  userData: {
    email: string;
    lastName: string;
    firstName: string;
    phoneNumber: string;
  };
  bakeryId: string | null;
  locationId: string | null;
  locationData: {
    label: string;
    street: string;
    latitude: number;
    longitude: number;
    buildingNo: string;
    description: string;
  };
  regionId: string;
  regionName: string;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  totalCapacity: number;
  paymentMethodId: string | null;
  paymentMethodType: string;
  paymentData: string | null;
  orderStatus:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";
  deliveryNote: string;
  keepAnonymous: boolean;
  cartType: string;
  assigningDate?: string;
  cardMessage: string | null;
  recipientData: string | null;
  wantedDeliveryDate: string | null;
  wantedDeliveryTimeSlot: string | null;
  willDeliverAt: string;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  qa?: OrderQA;
  addons: OrderItem[];
  sweets: OrderItem[];
  featuredCakes: OrderItem[];
  predesignedCakes: OrderItem[];
  customCakes: OrderItem[];
}

/**
 * Filter options for fetching orders
 */
export interface OrderFilters {
  status?: string[];
  regionId?: string;
}

/**
 * Orders financials types
 */
export interface OrderFinancialsRow {
  addonsTotal: number;
  bastiPercentage: number;
  bastiAmount: number;
  deliveryAmount: number;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  bakeryId: string;
  bakeryName: string;
  orderId: string;
  referenceNumber: string;
  deliveredAt: string;
}

export interface OrderFinancialsTotal {
  addonsTotal: number;
  bastiTotal: number;
  bakeryTotal: number;
  deliveryAmount: number;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

export interface OrderFinancialsPagination {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
}

export interface OrderFinancialsResponse {
  rows: OrderFinancialsRow[];
  total: OrderFinancialsTotal;
  pagination: OrderFinancialsPagination;
}

export interface OrderFinancialsFilters {
  bakeryId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/**
 * Order API service with CRUD methods
 */
export interface OrdersPagination {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface UnassignedOrdersPage {
  items: OrderResponse[];
  pagination: OrdersPagination;
}

export interface UnassignedOrdersFilters {
  page?: number;
  limit?: number;
  regionId?: string;
  type?: string;
  q?: string;
  status?: string[];
  sort?: "asc" | "desc";
}

export interface AssignedOrdersFilters {
  q?: string;
  status?: string[];
  sort?: "asc" | "desc";
}

export interface CompletedOrdersPage {
  items: OrderResponse[];
  pagination: OrdersPagination;
}

export interface CompletedOrdersFilters {
  page?: number;
  limit?: number;
  regionId?: string;
  q?: string;
  status?: string[];
  sort?: "asc" | "desc";
}

export interface BakeryOrdersPage {
  items: OrderResponse[];
  pagination: OrdersPagination;
}

export interface BakeryOrdersFilters {
  page?: number;
  limit?: number;
  regionId?: string;
  type?: string;
  q?: string;
  status?: string[];
  sort?: "asc" | "desc";
}

export const orderApi = {
  /**
   * Get all orders with optional filters
   *
   * @param filters - Optional filters object with status array and regionId
   * @returns Promise containing orders array
   */
  getAll: (filters?: OrderFilters): Promise<ApiResponse<OrderResponse[]>> => {
    const params = new URLSearchParams();

    if (filters?.status && filters.status.length > 0) {
      params.append("status", filters.status.join(","));
    }

    if (filters?.regionId) {
      params.append("regionId", filters.regionId);
    }

    const queryString = params.toString();
    const url = `/orders${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<OrderResponse[]>(url);
  },

  /**
   * Paginated feed of unassigned orders for the admin sidebar.
   * Backend filters: regionId, type (cartType), status[], q (reference search),
   * sort (asc | desc on createdAt), page, limit.
   */
  getUnassigned: (
    filters: UnassignedOrdersFilters,
  ): Promise<ApiResponse<UnassignedOrdersPage>> => {
    const params = new URLSearchParams();
    if (filters.page != null) params.append("page", String(filters.page));
    if (filters.limit != null) params.append("limit", String(filters.limit));
    if (filters.regionId) params.append("regionId", filters.regionId);
    if (filters.type) params.append("type", filters.type);
    if (filters.q && filters.q.trim()) params.append("q", filters.q.trim());
    if (filters.status && filters.status.length > 0) {
      params.append("status", filters.status.join(","));
    }
    if (filters.sort) params.append("sort", filters.sort);
    const queryString = params.toString();
    const url = `/orders/unassigned${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<UnassignedOrdersPage>(url);
  },

  /**
   * Paginated feed of completed orders for the admin completed-orders table.
   * Filters: regionId, q (reference search), status[], sort, page, limit.
   */
  getCompleted: (
    filters: CompletedOrdersFilters,
  ): Promise<ApiResponse<CompletedOrdersPage>> => {
    const params = new URLSearchParams();
    if (filters.page != null) params.append("page", String(filters.page));
    if (filters.limit != null) params.append("limit", String(filters.limit));
    if (filters.regionId) params.append("regionId", filters.regionId);
    if (filters.q && filters.q.trim()) params.append("q", filters.q.trim());
    if (filters.status && filters.status.length > 0) {
      params.append("status", filters.status.join(","));
    }
    if (filters.sort) params.append("sort", filters.sort);
    const queryString = params.toString();
    const url = `/orders/completed${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<CompletedOrdersPage>(url);
  },

  /**
   * Active orders that already have a bakery assigned, grouped by bakeryId.
   * Filters: q (reference search), status[], sort.
   */
  getAssigned: (
    filters: AssignedOrdersFilters,
  ): Promise<ApiResponse<Record<string, OrderResponse[]>>> => {
    const params = new URLSearchParams();
    if (filters.q && filters.q.trim()) params.append("q", filters.q.trim());
    if (filters.status && filters.status.length > 0) {
      params.append("status", filters.status.join(","));
    }
    if (filters.sort) params.append("sort", filters.sort);
    const queryString = params.toString();
    const url = `/orders/assigned${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<Record<string, OrderResponse[]>>(url);
  },

  /**
   * Get single order by ID
   */
  getOne: (
    id: string,
    regionId?: string,
  ): Promise<ApiResponse<OrderResponse>> => {
    const params = new URLSearchParams();
    if (regionId) {
      params.append("regionId", regionId);
    }

    const queryString = params.toString();
    const url = `/orders/${id}${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<OrderResponse>(url);
  },

  /**
   * Get user's orders
   */
  getMyOrders: (regionId?: string): Promise<ApiResponse<OrderResponse[]>> => {
    const params = new URLSearchParams();
    if (regionId) {
      params.append("regionId", regionId);
    }

    const queryString = params.toString();
    const url = `/orders/my-orders${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<OrderResponse[]>(url);
  },

  /**
   * Paginated orders for a specific bakery. Returns the same `{ items,
   * pagination }` envelope as the other paginated order endpoints.
   */
  getBakeryOrders: (
    bakeryId: string,
    filters?: BakeryOrdersFilters,
  ): Promise<ApiResponse<BakeryOrdersPage>> => {
    const params = new URLSearchParams();
    if (filters?.page != null) params.append("page", String(filters.page));
    if (filters?.limit != null) params.append("limit", String(filters.limit));
    if (filters?.regionId) params.append("regionId", filters.regionId);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.q && filters.q.trim()) params.append("q", filters.q.trim());
    if (filters?.status && filters.status.length > 0) {
      params.append("status", filters.status.join(","));
    }
    if (filters?.sort) params.append("sort", filters.sort);
    const queryString = params.toString();
    const url = `/orders/bakery/${bakeryId}${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<BakeryOrdersPage>(url);
  },

  /**
   * Unassign an order from a bakery
   */
  unassignFromBakery: (
    orderId: string,
    reason?: string,
  ): Promise<ApiResponse<{ id: string; bakeryId: string | null }>> => {
    const url = `/orders/${orderId}/unassign-bakery`;
    const data = reason ? { reason } : {};
    return apiClient.patch(url, data);
  },

  /**
   * Change order status
   */
  changeOrderStatus: (
    orderId: string,
    status:
      | "pending"
      | "confirmed"
      | "preparing"
      | "ready"
      | "out_for_delivery"
      | "delivered"
      | "cancelled",
  ): Promise<ApiResponse<{ id: string; status: string }>> => {
    const url = `/orders/${orderId}/status`;
    return apiClient.patch(url, { status });
  },

  /**
   * Finalize order with QA data (final images)
   */
  finalizeOrderQA: (
    orderId: string,
    bakeryId: string,
    finalImages: string[],
  ): Promise<ApiResponse<{ id: string; finalImages: string[] }>> => {
    const url = `/orders/${orderId}/qa`;
    return apiClient.patch(url, { bakeryId, finalImages, notes: [] });
  },

  /**
   * Get orders financials report
   */
  getFinancials: (
    filters?: OrderFinancialsFilters,
  ): Promise<ApiResponse<OrderFinancialsResponse>> => {
    const params = new URLSearchParams();
    if (filters?.bakeryId) params.append("bakeryId", filters.bakeryId);
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const queryString = params.toString();
    const url = `/orders/financials${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<OrderFinancialsResponse>(url);
  },
};
