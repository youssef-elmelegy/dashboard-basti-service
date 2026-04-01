/**
 * Add-On API Service
 * Handles all add-on related API calls
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

/**
 * Add-On data model
 */
export interface AddOn {
  id: string;
  name: string;
  description: string;
  images: string[];
  category: "balloons" | "cards" | "candles" | "decorations" | "other";
  price?: number;
  tags?: string[];
  tagId?: string;
  tagName?: string;
  isActive: boolean;
  options?: Array<{
    id?: string;
    type: "color" | "number" | "letter" | "text";
    label: string;
    value: string;
    imageUrl?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create add-on request payload
 */
export interface CreateAddOnRequest {
  name: string;
  description: string;
  images: string[];
  category: "balloons" | "cards" | "candles" | "decorations" | "other";
  price?: number;
  tagId?: string;
  isActive?: boolean;
  options?: Array<{
    type: "color" | "number" | "letter" | "text";
    label: string;
    value: string;
    imageUrl?: string;
  }>;
}

/**
 * Update add-on request payload
 */
export interface UpdateAddOnRequest {
  name?: string;
  description?: string;
  images?: string[];
  category?: "balloons" | "cards" | "candles" | "decorations" | "other";
  price?: number;
  tagId?: string;
  isActive?: boolean;
  options?: Array<{
    type: "color" | "number" | "letter" | "text";
    label: string;
    value: string;
    imageUrl?: string;
  }>;
}

/**
 * Pagination query params
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Pagination response metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Add-On API service with CRUD methods
 */
export const addOnApi = {
  /**
   * Get all add-ons with pagination
   */
  getAll: (
    query?: PaginationQuery,
  ): Promise<ApiResponse<PaginatedResponse<AddOn>>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<AddOn>>(
      `/addons${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get single add-on by ID
   */
  getOne: (id: string): Promise<ApiResponse<AddOn>> => {
    return apiClient.get<AddOn>(`/addons/${id}`);
  },

  /**
   * Create new add-on
   */
  create: (data: CreateAddOnRequest): Promise<ApiResponse<AddOn>> => {
    return apiClient.post<AddOn>("/addons", data);
  },

  /**
   * Update add-on
   */
  update: (
    id: string,
    data: UpdateAddOnRequest,
  ): Promise<ApiResponse<AddOn>> => {
    return apiClient.patch<AddOn>(`/addons/${id}`, data);
  },

  /**
   * Delete add-on
   */
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/addons/${id}`);
  },

  /**
   * Toggle add-on activation status
   */
  toggleStatus: (id: string): Promise<ApiResponse<AddOn>> => {
    return apiClient.patch<AddOn>(`/addons/${id}/toggle-status`, {});
  },
};
