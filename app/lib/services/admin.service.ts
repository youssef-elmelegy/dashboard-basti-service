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
  profileImage?: string;
}

export interface BlockAdminPayload {
  isBlocked: boolean;
}

export const adminService = {
  async getAll(): Promise<Admin[]> {
    const response = await apiClient.get<{
      admins: Admin[];
      total: number;
    }>("/admin-auth");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch admins");
    }

    return response.data?.admins || [];
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
};
