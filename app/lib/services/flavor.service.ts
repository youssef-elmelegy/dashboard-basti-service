import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

export interface Flavor {
  id: string;
  title: string;
  description: string;
  flavorUrl: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlavorRequest {
  title: string;
  description: string;
  flavorUrl: string;
}

export interface UpdateFlavorRequest {
  title?: string;
  description?: string;
  flavorUrl?: string;
}

export interface ShapeVariantImage {
  shapeId: string;
  slicedViewUrl: string;
  frontViewUrl: string;
  topViewUrl: string;
}

export interface CreateFlavorWithVariantImagesRequest {
  title: string;
  description: string;
  flavorUrl: string;
  variantImages: ShapeVariantImage[];
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

export interface FlavorVariantImage {
  id: string;
  shapeId: string;
  slicedViewUrl: string;
  frontViewUrl: string;
  topViewUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlavorConflictData {
  relatedConfigsCount: number;
  affectedPredesignedCakesCount: number;
  affectedPredesignedCakeIds: string[];
}

export const flavorApi = {
  /**
   * Get all flavors with pagination
   */
  getAll: (
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    order?: string,
  ): Promise<ApiResponse<PaginatedResponse<Flavor>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append("search", search);
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);

    return apiClient.get<PaginatedResponse<Flavor>>(
      `/custom-cakes/flavors?${params.toString()}`,
    );
  },

  /**
   * Get flavor by ID
   */
  getOne: (id: string): Promise<ApiResponse<Flavor>> => {
    return apiClient.get<Flavor>(`/custom-cakes/flavors/${id}`);
  },

  /**
   * Create new flavor
   */
  create: (data: CreateFlavorRequest): Promise<ApiResponse<Flavor>> => {
    return apiClient.post<Flavor>("/custom-cakes/flavors", data);
  },

  /**
   * Create new flavor with variant images
   */
  createWithVariantImages: (
    data: CreateFlavorWithVariantImagesRequest,
  ): Promise<ApiResponse<Flavor>> => {
    return apiClient.post<Flavor>(
      "/custom-cakes/flavors/with-variant-images",
      data,
    );
  },

  /**
   * Update flavor
   */
  update: (
    id: string,
    data: UpdateFlavorRequest,
  ): Promise<ApiResponse<Flavor>> => {
    return apiClient.patch<Flavor>(`/custom-cakes/flavors/${id}`, data);
  },

  /**
   * Delete flavor (safe — returns 409 if related predesigned cakes exist)
   */
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/custom-cakes/flavors/${id}`);
  },

  /**
   * Force-delete flavor and all its predesigned cake configs
   */
  forceDelete: (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(`/custom-cakes/flavors/${id}/force`);
  },

  /**
   * Change flavor order
   */
  changeOrder: (id: string, order: number): Promise<ApiResponse<Flavor[]>> => {
    return apiClient.patch<Flavor[]>(`/custom-cakes/flavors/${id}/order`, {
      order,
    });
  },

  /**
   * Get all shape variant images for a flavor
   */
  getVariantImages: (
    id: string,
  ): Promise<ApiResponse<FlavorVariantImage[]>> => {
    return apiClient.get<FlavorVariantImage[]>(
      `/custom-cakes/flavors/${id}/variant-images`,
    );
  },
};
