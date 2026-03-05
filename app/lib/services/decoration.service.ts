import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

export interface Decoration {
  id: string;
  title: string;
  description: string;
  decorationUrl: string;
  tagId?: string;
  tagName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDecorationRequest {
  title: string;
  description: string;
  decorationUrl: string;
  tagId?: string;
}

export interface UpdateDecorationRequest {
  title?: string;
  description?: string;
  decorationUrl?: string;
  tagId?: string;
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

export const decorationApi = {
  /**
   * Get all decorations with pagination
   */
  getAll: (
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    order?: string,
  ): Promise<ApiResponse<PaginatedResponse<Decoration>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append("search", search);
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);

    return apiClient.get<PaginatedResponse<Decoration>>(
      `/custom-cakes/decorations?${params.toString()}`,
    );
  },

  /**
   * Get decoration by ID
   */
  getOne: (id: string): Promise<ApiResponse<Decoration>> => {
    return apiClient.get<Decoration>(`/custom-cakes/decorations/${id}`);
  },

  /**
   * Create new decoration
   */
  create: (data: CreateDecorationRequest): Promise<ApiResponse<Decoration>> => {
    return apiClient.post<Decoration>("/custom-cakes/decorations", data);
  },

  /**
   * Update decoration
   */
  update: (
    id: string,
    data: UpdateDecorationRequest,
  ): Promise<ApiResponse<Decoration>> => {
    return apiClient.patch<Decoration>(`/custom-cakes/decorations/${id}`, data);
  },

  /**
   * Delete decoration
   */
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(
      `/custom-cakes/decorations/${id}`,
    );
  },
};
