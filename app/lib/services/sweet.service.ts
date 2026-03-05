/**
 * Sweet API Service
 * Handles all sweet-related API calls
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

export interface Sweet {
  id: string;
  name: string;
  description: string;
  images: string[];
  sizes: string[];
  tagId: string | null;
  tagName: string | null;
  price?: number;
  sizesPrices?: Record<string, number>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSweetRequest {
  name: string;
  description: string;
  images: string[];
  sizes: string[];
  tagId?: string;
  isActive?: boolean;
}

export interface UpdateSweetRequest {
  name?: string;
  description?: string;
  images?: string[];
  sizes?: string[];
  tagId?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export const sweetService = {
  /**
   * Get all sweets with pagination
   */
  getAll: (query?: {
    page?: number;
    limit?: number;
    tag?: string;
    search?: string;
    regionId?: string;
  }): Promise<ApiResponse<PaginatedResponse<Sweet>>> => {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", query.page.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.tag) params.append("tag", query.tag);
    if (query?.search) params.append("search", query.search);
    if (query?.regionId) params.append("regionId", query.regionId);
    const queryString = params.toString();
    return apiClient.get<PaginatedResponse<Sweet>>(
      `/sweets${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * Get single sweet by ID
   */
  getOne: (id: string): Promise<ApiResponse<Sweet>> => {
    return apiClient.get<Sweet>(`/sweets/${id}`);
  },

  /**
   * Create new sweet
   */
  create: (data: CreateSweetRequest): Promise<ApiResponse<Sweet>> => {
    return apiClient.post<Sweet>("/sweets", data);
  },

  /**
   * Update sweet
   */
  update: (
    id: string,
    data: UpdateSweetRequest,
  ): Promise<ApiResponse<Sweet>> => {
    return apiClient.patch<Sweet>(`/sweets/${id}`, data);
  },

  /**
   * Delete sweet
   */
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/sweets/${id}`);
  },

  /**
   * Toggle sweet status
   */
  toggleStatus: (id: string): Promise<ApiResponse<Sweet>> => {
    return apiClient.patch<Sweet>(`/sweets/${id}/toggle-status`, {});
  },
};
