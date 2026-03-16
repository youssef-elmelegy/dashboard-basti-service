import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

export interface Shape {
  id: string;
  title: string;
  description: string;
  shapeUrl: string;
  size: "small" | "medium" | "large";
  capacity: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShapeRequest {
  title: string;
  description: string;
  shapeUrl: string;
  size: "small" | "medium" | "large";
  capacity: number;
  order?: number;
}

export interface UpdateShapeRequest {
  title?: string;
  description?: string;
  shapeUrl?: string;
  size?: "small" | "medium" | "large";
  capacity?: number;
  order?: number;
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

export interface ShapeConflictData {
  relatedConfigsCount: number;
  affectedPredesignedCakesCount: number;
  affectedPredesignedCakeIds: string[];
}

export const shapeApi = {
  /**
   * Get all shapes with pagination
   */
  getAll: (
    search?: string,
    sortBy?: string,
    order?: string,
  ): Promise<ApiResponse<PaginatedResponse<Shape>>> => {
    const params = new URLSearchParams({});
    if (search) params.append("search", search);
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/custom-cakes/shapes?${queryString}`
      : `/custom-cakes/shapes`;

    return apiClient.get<PaginatedResponse<Shape>>(endpoint);
  },

  /**
   * Get shape by ID
   */
  getOne: (id: string): Promise<ApiResponse<Shape>> => {
    return apiClient.get<Shape>(`/custom-cakes/shapes/${id}`);
  },

  /**
   * Create new shape
   */
  create: (data: CreateShapeRequest): Promise<ApiResponse<Shape>> => {
    return apiClient.post<Shape>("/custom-cakes/shapes", data);
  },

  /**
   * Update shape
   */
  update: (
    id: string,
    data: UpdateShapeRequest,
  ): Promise<ApiResponse<Shape>> => {
    return apiClient.patch<Shape>(`/custom-cakes/shapes/${id}`, data);
  },

  /**
   * Delete shape
   */
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/custom-cakes/shapes/${id}`);
  },

  /**
   * Force-delete shape and all related predesigned cake configs
   */
  forceDelete: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(`/custom-cakes/shapes/${id}/force`);
  },

  /**
   * Change shape order
   */
  changeOrder: (id: string, order: number): Promise<ApiResponse<Shape[]>> => {
    return apiClient.patch<Shape[]>(`/custom-cakes/shapes/${id}/order`, {
      order,
    });
  },
};
