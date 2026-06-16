import { apiClient } from "@/lib/api-client";

export interface Admin {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "manager";
  profileImage: string | null;
  bakeryId?: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminPayload {
  email: string;
  password: string;
  role: "super_admin" | "admin" | "manager";
  bakeryId?: string;
  profileImage?: string;
}

export interface UpdateAdminPayload {
  role?: "super_admin" | "admin" | "manager";
  bakeryId?: string;
  profileImage?: string | null;
}

export interface BlockAdminPayload {
  isBlocked: boolean;
}

export interface AdminsPagination {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface AdminsPage {
  items: Admin[];
  pagination: AdminsPagination;
}

export interface AdminsFilters {
  page?: number;
  limit?: number;
}

export const adminService = {
  async getAll(filters: AdminsFilters = {}): Promise<AdminsPage> {
    const params = new URLSearchParams();
    if (filters.page != null) params.append("page", String(filters.page));
    if (filters.limit != null) params.append("limit", String(filters.limit));
    const queryString = params.toString();
    const url = `/admin-auth${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<AdminsPage>(url);

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch admins");
    }

    return (
      response.data ?? {
        items: [],
        pagination: {
          total: 0,
          totalPages: 0,
          page: filters.page ?? 1,
          limit: filters.limit ?? 10,
        },
      }
    );
  },

  async create(payload: CreateAdminPayload): Promise<Admin> {
    const response = await apiClient.post<Admin>("/admin-auth/create", payload);

    if (!response.success) {
      throw new Error(response.message || "Failed to create admin");
    }

    return response.data!;
  },

  async update(id: string, payload: UpdateAdminPayload): Promise<Admin> {
    const response = await apiClient.patch<Admin>(
      `/admin-auth/${id}/update`,
      payload,
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update admin");
    }

    return response.data!;
  },

  async block(id: string, payload: BlockAdminPayload): Promise<Admin> {
    const response = await apiClient.patch<Admin>(
      `/admin-auth/${id}/block`,
      payload,
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to block admin");
    }

    return response.data!;
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<null>(`/admin-auth/${id}`);

    if (!response.success) {
      throw new Error(response.message || "Failed to delete admin");
    }
  },
};
