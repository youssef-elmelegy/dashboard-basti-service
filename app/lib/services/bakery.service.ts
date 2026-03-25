/**
 * Bakery API Service
 * Handles all bakery-related API calls
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

/**
 * Bakery type definitions
 */
export type BakeryType = "big_cakes" | "small_cakes" | "others";

/**
 * Bakery data model
 */
export interface Bakery {
  id: string;
  name: string;
  locationDescription: string;
  regionId: string;
  capacity: number;
  types: BakeryType[];
  averageRating: number | null;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create bakery request payload
 */
export interface CreateBakeryRequest {
  name: string;
  locationDescription: string;
  regionId: string;
  capacity: number;
  bakeryTypes: BakeryType[];
}

/**
 * Update bakery request payload
 */
export interface UpdateBakeryRequest {
  name?: string;
  locationDescription?: string;
  regionId?: string;
  capacity?: number;
  bakeryTypes?: BakeryType[];
}

/**
 * Bakery item store data model
 */
export interface BakeryItemStore {
  id: string;
  bakeryId: string;
  regionItemPriceId: string;
  stock: number;
  price: string;
  sizesPrices?: Record<string, string> | null;
  addonId?: string | null;
  featuredCakeId?: string | null;
  sweetId?: string | null;
  decorationId?: string | null;
  flavorId?: string | null;
  shapeId?: string | null;
  predesignedCakeId?: string | null;
  product?: {
    id: string;
    name: string;
    description: string;
    images: string[];
    type: "addon" | "sweet" | "featured_cake";
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bakery API service with CRUD methods
 */
export const bakeryApi = {
  /**
   * Get all bakeries
   */
  getAll: (): Promise<ApiResponse<Bakery[]>> => {
    return apiClient.get<Bakery[]>("/bakeries");
  },

  /**
   * Get single bakery by ID
   */
  getOne: (id: string): Promise<ApiResponse<Bakery>> => {
    return apiClient.get<Bakery>(`/bakeries/${id}`);
  },

  /**
   * Create new bakery
   *
   * REQUIRED FIELDS:
   * - name: string (2-255 chars)
   * - locationDescription: string (min 5 chars)
   * - regionId: string (valid UUID)
   * - capacity: number (>= 0)
   * - bakeryTypes: string[] (valid types: basket_cakes, midume, small_cakes, large_cakes, custom)
   */
  create: (bakeryData: CreateBakeryRequest): Promise<ApiResponse<Bakery>> => {
    return apiClient.post<Bakery>("/bakeries", bakeryData);
  },

  /**
   * Update existing bakery
   */
  update: (
    id: string,
    bakeryData: UpdateBakeryRequest,
  ): Promise<ApiResponse<Bakery>> => {
    return apiClient.patch<Bakery>(`/bakeries/${id}`, bakeryData);
  },

  /**
   * Delete bakery by ID
   */
  delete: (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/bakeries/${id}`);
  },

  /**
   * Get all item stores for a bakery with product details
   */
  getItems: (bakeryId: string): Promise<ApiResponse<BakeryItemStore[]>> => {
    return apiClient.get<BakeryItemStore[]>(`/bakeries/${bakeryId}/items`);
  },

  /**
   * Update stock for a bakery item store
   */
  updateItemStock: (
    bakeryId: string,
    storeId: string,
    stock: number,
  ): Promise<ApiResponse<BakeryItemStore>> => {
    return apiClient.patch<BakeryItemStore>(
      `/bakeries/${bakeryId}/items/${storeId}/stock`,
      { stock },
    );
  },
};
