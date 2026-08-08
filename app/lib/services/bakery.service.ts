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
 * Color classes for bakery type badges, matching the order type card colors
 */
export const BAKERY_TYPE_COLORS: Record<BakeryType, string> = {
  big_cakes: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  small_cakes: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  others: "bg-teal-500/10 text-teal-500 border-teal-500/20",
};

/**
 * Maximum gallery images a bakery can hold. Mirrors
 * `BAKERY_GALLERY_MAX_IMAGES` in the backend schema, which is also enforced by
 * a CHECK constraint — keep both in step.
 */
export const BAKERY_GALLERY_MAX_IMAGES = 3;

/** Maximum length of the management-only notes field. Mirrors the backend DTO. */
export const BAKERY_NOTES_MAX_LENGTH = 2000;

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
  /** Management-only free-text notes. Null when never set. */
  notes: string | null;
  /** Logo icon URL. Null when the bakery has no logo. */
  logoUrl: string | null;
  /** Up to BAKERY_GALLERY_MAX_IMAGES image URLs; empty when unset. */
  galleryImages: string[];
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
  /** Optional management fields — omit entirely when not set. */
  notes?: string;
  logoUrl?: string;
  galleryImages?: string[];
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
  /**
   * Optional management fields. `undefined` leaves the stored value untouched;
   * an explicit `null` clears notes/logo, and `[]` clears the gallery.
   */
  notes?: string | null;
  logoUrl?: string | null;
  galleryImages?: string[];
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
  optionsStock?: Array<{
    optionId: string;
    stock: number;
    label?: string;
    value?: string;
    type?: string;
    imageUrl?: string | null;
  }>;
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
   * - bakeryTypes: string[] (valid types: big_cakes, small_cakes, others)
   *
   * OPTIONAL FIELDS:
   * - notes: string (management-only, max 2000 chars)
   * - logoUrl: string (uploaded image URL)
   * - galleryImages: string[] (uploaded image URLs, max 3)
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
   * Can accept either a number (for simple items) or an object with stock and optionsStock (for addons)
   */
  updateItemStock: (
    bakeryId: string,
    storeId: string,
    payload:
      | number
      | {
          stock: number;
          optionsStock?: Array<{ optionId: string; stock: number }>;
        },
  ): Promise<ApiResponse<BakeryItemStore>> => {
    const body = typeof payload === "number" ? { stock: payload } : payload;
    return apiClient.patch<BakeryItemStore>(
      `/bakeries/${bakeryId}/items/${storeId}/stock`,
      body,
    );
  },
};
