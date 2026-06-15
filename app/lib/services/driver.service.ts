import { apiClient } from "@/lib/api-client";

/**
 * Driver = an admin with role "driver", scoped to a region.
 * Endpoints live under /drivers (see backend DriverController).
 */
export interface Driver {
  id: string;
  name?: string | null;
  email: string;
  phoneNumber?: string | null;
  dueAmount?: number;
  role?: "driver";
  profileImage?: string | null;
  bakeryId?: string | null;
  regionId?: string | null;
  isBlocked: boolean;
  blockedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface DriverReport {
  id: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
  };
  driverId: string;
  reportBody: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A report as returned by the "all reports" endpoint, which also embeds the
 * reported driver's basic info (per-driver reports omit this).
 */
export interface ReportListItem extends DriverReport {
  driver: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
  };
}

export interface DriverOrder {
  id: string;
  referenceNumber: string | null;
  orderStatus: string | null;
  driverId: string | null;
  driverAssignedAt: string | null;
  driverData: {
    name: string;
    profileImage: string;
    phoneNumber: string;
  } | null;
  userData: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  } | null;
  locationData: unknown;
  willDeliverAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverPayload {
  name?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  regionId?: string;
  profileImage?: string;
}

export interface UpdateDriverPayload {
  name?: string;
  phoneNumber?: string;
  regionId?: string;
  profileImage?: string | null;
}

export interface ListDriversParams {
  page?: number;
  limit?: number;
  q?: string;
  isBlocked?: boolean;
}

export interface ListReportsParams {
  page?: number;
  limit?: number;
  q?: string;
  sort?: "asc" | "desc";
}

export interface ListDriverOrdersParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  sort?: "asc" | "desc";
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, value);
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

export const driverService = {
  async getByRegion(
    regionId: string,
    { page = 1, limit = 10, q, isBlocked }: ListDriversParams = {},
  ): Promise<Paginated<Driver>> {
    const query = buildQuery({
      regionId,
      page: String(page),
      limit: String(limit),
      q,
      isBlocked: typeof isBlocked === "boolean" ? String(isBlocked) : undefined,
    });
    const res = await apiClient.get<Paginated<Driver>>(`/drivers${query}`);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to fetch drivers");
    }
    return res.data;
  },

  async getOne(id: string): Promise<Driver> {
    const res = await apiClient.get<Driver>(`/drivers/${id}`);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to fetch driver");
    }
    return res.data;
  },

  /** All driver reports across every driver (super_admin / admin only). */
  async getAllReports(
    { page = 1, limit = 10, q, sort = "desc" }: ListReportsParams = {},
  ): Promise<Paginated<ReportListItem>> {
    const query = buildQuery({ page: String(page), limit: String(limit), q, sort });
    const res = await apiClient.get<Paginated<ReportListItem>>(
      `/drivers/reports${query}`,
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to fetch reports");
    }
    return res.data;
  },

  async getReports(
    id: string,
    { page = 1, limit = 10, q, sort = "desc" }: ListReportsParams = {},
  ): Promise<Paginated<DriverReport>> {
    const query = buildQuery({ page: String(page), limit: String(limit), q, sort });
    const res = await apiClient.get<Paginated<DriverReport>>(
      `/drivers/${id}/reports${query}`,
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to fetch reports");
    }
    return res.data;
  },

  async getOrders(
    id: string,
    { page = 1, limit = 10, q, status, sort = "desc" }: ListDriverOrdersParams = {},
  ): Promise<Paginated<DriverOrder>> {
    const query = buildQuery({
      page: String(page),
      limit: String(limit),
      q,
      status: status && status.length > 0 ? status.join(",") : undefined,
      sort,
    });
    const res = await apiClient.get<Paginated<DriverOrder>>(
      `/drivers/${id}/orders${query}`,
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to fetch driver orders");
    }
    return res.data;
  },

  async create(payload: CreateDriverPayload): Promise<void> {
    const res = await apiClient.post<unknown>("/drivers", payload);
    if (!res.success) throw new Error(res.message || "Failed to create driver");
  },

  async update(id: string, payload: UpdateDriverPayload): Promise<void> {
    const res = await apiClient.patch<unknown>(`/drivers/${id}/update`, payload);
    if (!res.success) throw new Error(res.message || "Failed to update driver");
  },

  async block(id: string, isBlocked: boolean): Promise<void> {
    const res = await apiClient.patch<unknown>(`/drivers/${id}/block`, { isBlocked });
    if (!res.success) throw new Error(res.message || "Failed to update block status");
  },

  async updateDueAmount(id: string, dueAmount: number): Promise<Driver> {
    const res = await apiClient.patch<Driver>(`/drivers/${id}/due-amount`, {
      dueAmount,
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to update due amount");
    }
    return res.data;
  },

  async remove(id: string): Promise<void> {
    const res = await apiClient.delete<unknown>(`/drivers/${id}`);
    if (!res.success) throw new Error(res.message || "Failed to delete driver");
  },
};
