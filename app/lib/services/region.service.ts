import { apiClient, type ApiResponse } from "@/lib/api-client";
import type { Region } from "@/data/regions";

export interface CreateRegionRequest {
  name: string;
  image?: string;
  isAvailable?: boolean;
}

export interface UpdateRegionRequest {
  name: string;
  image?: string;
  isAvailable?: boolean;
}

export interface ChangeRegionOrderRequest {
  order: number;
}

export const regionApi = {
  /**
   * Get all regions
   */
  async getAll(): Promise<ApiResponse<Region[]>> {
    return apiClient.get<Region[]>("/regions");
  },

  /**
   * Get region by ID
   */
  async getOne(id: string): Promise<ApiResponse<Region>> {
    return apiClient.get<Region>(`/regions/${id}`);
  },

  /**
   * Create a new region
   */
  async create(data: CreateRegionRequest): Promise<ApiResponse<Region>> {
    return apiClient.post<Region>("/regions", data);
  },

  /**
   * Update a region
   */
  async update(
    id: string,
    data: UpdateRegionRequest,
  ): Promise<ApiResponse<Region>> {
    return apiClient.patch<Region>(`/regions/${id}`, data);
  },

  /**
   * Delete a region
   */
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/regions/${id}`);
  },

  /**
   * Change region order
   */
  async changeOrder(id: string, order: number): Promise<ApiResponse<Region[]>> {
    return apiClient.patch<Region[]>(`/regions/${id}/order`, { order });
  },
};
