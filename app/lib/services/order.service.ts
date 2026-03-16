/**
 * Order API Service
 * Handles all order-related API calls
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

/**
 * Order Item type definition
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
 * Order API service with CRUD methods
 */
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
   * Get orders assigned to a specific bakery
   */
  getBakeryOrders: (
    bakeryId: string,
    filters?: OrderFilters,
  ): Promise<ApiResponse<OrderResponse[]>> => {
    const params = new URLSearchParams();

    if (filters?.status && filters.status.length > 0) {
      params.append("status", filters.status.join(","));
    }

    if (filters?.regionId) {
      params.append("regionId", filters.regionId);
    }

    const queryString = params.toString();
    const url = `/orders/bakery/${bakeryId}${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<OrderResponse[]>(url);
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
};
