import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

export interface DesignedCakeConfig {
  id: string;
  flavor: {
    id: string;
    title: string;
    description: string;
    flavorUrl: string;
    createdAt: string;
    updatedAt: string;
  };
  decoration: {
    id: string;
    title: string;
    description: string;
    decorationUrl: string;
    tagId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  shape: {
    id: string;
    title: string;
    description: string;
    shapeUrl: string;
    createdAt: string;
    updatedAt: string;
  };
  frostColorValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignedCakeConfigRequestDto {
  flavorId: string;
  decorationId: string;
  shapeId: string;
  frostColorValue: string;
}

export interface PredesignedCake {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  tagId?: string;
  tagName?: string;
  configs: DesignedCakeConfig[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PredesignedCakeResponse {
  items: PredesignedCake[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface CreatePredesignedCakeDto {
  name: string;
  description: string;
  tagId?: string;
  configs: DesignedCakeConfigRequestDto[];
}

export interface UpdatePredesignedCakeDto {
  name?: string;
  description?: string;
  tagId?: string;
  configs?: DesignedCakeConfigRequestDto[];
}

class PredesignedCakeService {
  async getAll(
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    order: string = "DESC",
    regionId?: string,
    search?: string,
  ): Promise<ApiResponse<PredesignedCakeResponse>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      order,
      ...(regionId && { regionId }),
      ...(search && { search }),
    });
    return apiClient.get(
      `/custom-cakes/predesigned-cakes?${params.toString()}`,
    );
  }

  async getById(id: string): Promise<ApiResponse<PredesignedCake>> {
    return apiClient.get(`/custom-cakes/predesigned-cakes/${id}`);
  }

  async create(
    data: CreatePredesignedCakeDto,
  ): Promise<ApiResponse<PredesignedCake>> {
    return apiClient.post("/custom-cakes/predesigned-cakes", data);
  }

  async update(
    id: string,
    data: UpdatePredesignedCakeDto,
  ): Promise<ApiResponse<PredesignedCake>> {
    return apiClient.patch(`/custom-cakes/predesigned-cakes/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/custom-cakes/predesigned-cakes/${id}`);
  }

  async toggleActive(id: string): Promise<ApiResponse<PredesignedCake>> {
    return apiClient.patch(
      `/custom-cakes/predesigned-cakes/${id}/toggle-status`,
      {},
    );
  }
}

export const predesignedCakeService = new PredesignedCakeService();
