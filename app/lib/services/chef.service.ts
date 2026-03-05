import { apiClient, type ApiResponse } from "@/lib/api-client";

export type Chef = {
  id: string;
  name: string;
  specialization: string;
  bio?: string | null;
  image: string | null;
  bakeryId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateChefRequest = {
  name: string;
  specialization: string;
  bio?: string;
  image?: string;
  bakeryId: string;
};

export type UpdateChefRequest = Partial<CreateChefRequest>;

export type PaginatedChefResponse = {
  items: Chef[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const chefApi = {
  getAll: async (
    page = 1,
    limit = 10,
  ): Promise<ApiResponse<PaginatedChefResponse>> => {
    return apiClient.get<PaginatedChefResponse>(
      `/chefs?page=${page}&limit=${limit}`,
    );
  },

  getOne: async (id: string): Promise<ApiResponse<Chef>> => {
    return apiClient.get<Chef>(`/chefs/${id}`);
  },

  create: async (data: CreateChefRequest): Promise<ApiResponse<Chef>> => {
    return apiClient.post<Chef>("/chefs", data);
  },

  update: async (
    id: string,
    data: UpdateChefRequest,
  ): Promise<ApiResponse<Chef>> => {
    return apiClient.patch<Chef>(`/chefs/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/chefs/${id}`);
  },
};
