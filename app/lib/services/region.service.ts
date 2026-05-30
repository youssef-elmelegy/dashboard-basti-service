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

export type RegionalProductType =
  | "featured-cakes"
  | "addons"
  | "flavors"
  | "shapes"
  | "decorations"
  | "sweets"
  | "predesigned-cakes";

export interface RegionalProduct {
  id: string;
  name?: string;
  title?: string;
  type: RegionalProductType;
  [key: string]: unknown;
}

export interface RegionalProductsResponse {
  items: RegionalProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

  /**
   * Get items priced for a specific region. Pass `types` to fetch only those
   * product families (e.g. only decorations) — the backend skips every other
   * family entirely, so this is far cheaper than fetching everything and
   * filtering client-side.
   */
  async getRegionalProducts(
    regionId: string,
    options: {
      types?: RegionalProductType[];
      page?: number;
      limit?: number;
    } = {},
  ): Promise<ApiResponse<RegionalProductsResponse>> {
    const { types, page = 1, limit = 20 } = options;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (types && types.length > 0) params.set("types", types.join(","));
    return apiClient.get<RegionalProductsResponse>(
      `/regions/${regionId}/products?${params.toString()}`,
    );
  },
};
