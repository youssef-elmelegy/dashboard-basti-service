/**
 * Featured Cake API Service
 * Handles all featured cake-related API calls
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

/**
 * Featured Cake data model
 */
export interface FeaturedCake {
  id: string;
  name: string;
  description: string;
  images: string[];
  capacity: number;
  flavorList: string[];
  pipingPaletteList: string[];
  tagId: string;
  tagName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create featured cake request payload
 */
export interface CreateFeaturedCakeRequest {
  name: string;
  description: string;
  images: string[];
  capacity: number;
  flavorList: string[];
  pipingPaletteList: string[];
  tagId: string;
  isActive?: boolean;
}

/**
 * Update featured cake request payload
 */
export interface UpdateFeaturedCakeRequest {
  name?: string;
  description?: string;
  images?: string[];
  capacity?: number;
  flavorList?: string[];
  pipingPaletteList?: string[];
  tagId?: string;
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
 * Featured Cake API service with CRUD methods
 */
export const featuredCakeApi = {
  /**
   * Get all featured cakes with pagination
   */
  getAll: (
    query?: PaginationQuery,
  ): Promise<ApiResponse<PaginatedResponse<FeaturedCake>>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<FeaturedCake>>(
      `/featured-cakes${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get single featured cake by ID
   */
  getOne: (id: string): Promise<ApiResponse<FeaturedCake>> => {
    return apiClient.get<FeaturedCake>(`/featured-cakes/${id}`);
  },

  /**
   * Create new featured cake
   */
  create: (
    data: CreateFeaturedCakeRequest,
  ): Promise<ApiResponse<FeaturedCake>> => {
    return apiClient.post<FeaturedCake>("/featured-cakes", data);
  },

  /**
   * Update featured cake
   * All fields are optional for partial updates
   */
  update: (
    id: string,
    data: UpdateFeaturedCakeRequest,
  ): Promise<ApiResponse<FeaturedCake>> => {
    return apiClient.patch<FeaturedCake>(`/featured-cakes/${id}`, data);
  },

  /**
   * Delete featured cake
   */
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/featured-cakes/${id}`);
  },

  /**
   * Toggle featured cake activation status
   */
  toggleStatus: (id: string): Promise<ApiResponse<FeaturedCake>> => {
    return apiClient.patch<FeaturedCake>(
      `/featured-cakes/${id}/toggle-status`,
      {},
    );
  },
};
