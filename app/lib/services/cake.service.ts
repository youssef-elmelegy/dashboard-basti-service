/**
 * Cake API Service
 * Handles all cake-related API calls
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

/**
 * Cake data model
 */
export interface Cake {
  id: string;
  name: string;
  description: string;
  images: string[];
  mainPrice: number;
  capacity: number;
  tags: string[];
  flavors: string[];
  sizes: Array<{
    size: string;
    price: number;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create cake request payload
 */
export interface CreateCakeRequest {
  name: string;
  description: string;
  images: string[];
  mainPrice: number;
  capacity: number;
  tags: string[];
  flavors: string[];
  sizes: Array<{
    size: string;
    price: number;
  }>;
  isActive?: boolean;
}

/**
 * Update cake request payload
 */
export interface UpdateCakeRequest {
  name?: string;
  description?: string;
  images?: string[];
  mainPrice?: number;
  capacity?: number;
  tags?: string[];
  flavors?: string[];
  sizes?: Array<{
    size: string;
    price: number;
  }>;
  isActive?: boolean;
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
 * Cake API service with CRUD methods
 */
export const cakeApi = {
  /**
   * Get all cakes with pagination
   */
  getAll: (
    query?: PaginationQuery,
  ): Promise<ApiResponse<PaginatedResponse<Cake>>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<Cake>>(
      `/cakes${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get single cake by ID
   */
  getOne: (id: string): Promise<ApiResponse<Cake>> => {
    return apiClient.get<Cake>(`/cakes/${id}`);
  },

  /**
   * Create new cake
   *
   * REQUIRED FIELDS:
   * - name: string (2-255 chars)
   * - description: string (10-1000 chars)
   * - images: string[] (URLs)
   * - basePrice: number (>= 0)
   * - capacity: number (>= 0)
   * - tags: string[]
   * - flavors: string[] (at least 1)
   * - sizes: Array with name and price
   */
  create: (data: CreateCakeRequest): Promise<ApiResponse<Cake>> => {
    return apiClient.post<Cake>("/cakes", data);
  },

  /**
   * Update cake
   * All fields are optional for partial updates
   */
  update: (id: string, data: UpdateCakeRequest): Promise<ApiResponse<Cake>> => {
    return apiClient.patch<Cake>(`/cakes/${id}`, data);
  },

  /**
   * Delete cake
   */
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/cakes/${id}`);
  },

  /**
   * Toggle cake activation status
   */
  toggleStatus: (id: string): Promise<ApiResponse<Cake>> => {
    return apiClient.patch<Cake>(`/cakes/${id}/toggle-status`, {});
  },
};
