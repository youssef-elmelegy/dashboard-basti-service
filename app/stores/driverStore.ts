import { create } from "zustand";
import {
  driverService,
  type Driver,
  type DriverReport,
  type DriverOrder,
  type PaginationMeta,
  type CreateDriverPayload,
  type UpdateDriverPayload,
  type ListDriversParams,
  type ListReportsParams,
  type ListDriverOrdersParams,
} from "@/lib/services/driver.service";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const obj = error as { message?: unknown; details?: unknown };
    if (Array.isArray(obj.details) && obj.details.length > 0) {
      return obj.details.filter((d) => typeof d === "string").join("; ");
    }
    if (typeof obj.details === "string" && obj.details.length > 0) {
      return obj.details;
    }
    if (typeof obj.message === "string" && obj.message.length > 0) {
      return obj.message;
    }
  }
  if (typeof error === "string" && error.length > 0) return error;
  return fallback;
}

const emptyPagination: PaginationMeta = {
  total: 0,
  totalPages: 1,
  page: 1,
  limit: 10,
};

const DRIVERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface DriverStore {
  // Region drivers list
  drivers: Driver[];
  listPagination: PaginationMeta;
  isListLoading: boolean;
  lastFetchTime: number | null;

  // Single driver detail
  currentDriver: Driver | null;
  isDriverLoading: boolean;

  // Reports
  reports: DriverReport[];
  reportsPagination: PaginationMeta;
  isReportsLoading: boolean;

  // Order history
  orders: DriverOrder[];
  ordersPagination: PaginationMeta;
  isOrdersLoading: boolean;

  error: string | null;

  fetchRegionDrivers: (regionId: string, params?: ListDriversParams) => Promise<void>;
  fetchDriver: (id: string) => Promise<void>;
  fetchReports: (id: string, params?: ListReportsParams) => Promise<void>;
  fetchOrders: (id: string, params?: ListDriverOrdersParams) => Promise<void>;

  createDriver: (payload: CreateDriverPayload) => Promise<void>;
  updateDriver: (id: string, payload: UpdateDriverPayload) => Promise<void>;
  blockDriver: (id: string, isBlocked: boolean) => Promise<void>;
  updateDueAmount: (id: string, dueAmount: number) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  clearError: () => void;
  resetDetail: () => void;
  invalidate: () => void;
}

export const useDriverStore = create<DriverStore>((set, get) => ({
  drivers: [],
  listPagination: emptyPagination,
  isListLoading: false,
  lastFetchTime: null,

  currentDriver: null,
  isDriverLoading: false,

  reports: [],
  reportsPagination: emptyPagination,
  isReportsLoading: false,

  orders: [],
  ordersPagination: emptyPagination,
  isOrdersLoading: false,

  error: null,

  fetchRegionDrivers: async (regionId, params) => {
    const state = get();
    const now = Date.now();

    if (
      state.drivers.length > 0 &&
      state.lastFetchTime &&
      now - state.lastFetchTime < DRIVERS_CACHE_DURATION
    ) {
      return;
    }

    set({ isListLoading: true, error: null });
    try {
      const data = await driverService.getByRegion(regionId, params);
      set({
        drivers: data.items,
        listPagination: data.pagination,
        isListLoading: false,
        lastFetchTime: now,
      });
    } catch (error) {
      set({
        error: extractErrorMessage(error, "Failed to fetch drivers"),
        isListLoading: false,
      });
    }
  },

  fetchDriver: async (id) => {
    set({ isDriverLoading: true, error: null });
    try {
      const driver = await driverService.getOne(id);
      set({ currentDriver: driver, isDriverLoading: false });
    } catch (error) {
      set({
        error: extractErrorMessage(error, "Failed to fetch driver"),
        isDriverLoading: false,
      });
    }
  },

  fetchReports: async (id, params) => {
    set({ isReportsLoading: true, error: null });
    try {
      const data = await driverService.getReports(id, params);
      set({
        reports: data.items,
        reportsPagination: data.pagination,
        isReportsLoading: false,
      });
    } catch (error) {
      set({
        error: extractErrorMessage(error, "Failed to fetch reports"),
        isReportsLoading: false,
      });
    }
  },

  fetchOrders: async (id, params) => {
    set({ isOrdersLoading: true, error: null });
    try {
      const data = await driverService.getOrders(id, params);
      set({
        orders: data.items,
        ordersPagination: data.pagination,
        isOrdersLoading: false,
      });
    } catch (error) {
      set({
        error: extractErrorMessage(error, "Failed to fetch driver orders"),
        isOrdersLoading: false,
      });
    }
  },

  createDriver: async (payload) => {
    try {
      await driverService.create(payload);
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to create driver");
      set({ error: message });
      throw error;
    }
  },

  updateDriver: async (id, payload) => {
    try {
      await driverService.update(id, payload);
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to update driver");
      set({ error: message });
      throw error;
    }
  },

  blockDriver: async (id, isBlocked) => {
    try {
      await driverService.block(id, isBlocked);
      set((state) => ({
        currentDriver:
          state.currentDriver && state.currentDriver.id === id
            ? { ...state.currentDriver, isBlocked }
            : state.currentDriver,
        drivers: state.drivers.map((d) => (d.id === id ? { ...d, isBlocked } : d)),
      }));
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to update block status");
      set({ error: message });
      throw error;
    }
  },

  updateDueAmount: async (id, dueAmount) => {
    try {
      const updated = await driverService.updateDueAmount(id, dueAmount);
      set((state) => ({
        currentDriver:
          state.currentDriver && state.currentDriver.id === id
            ? { ...state.currentDriver, dueAmount: updated.dueAmount ?? dueAmount }
            : state.currentDriver,
        drivers: state.drivers.map((d) =>
          d.id === id ? { ...d, dueAmount: updated.dueAmount ?? dueAmount } : d,
        ),
      }));
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to update due amount");
      set({ error: message });
      throw error;
    }
  },

  deleteDriver: async (id) => {
    try {
      await driverService.remove(id);
      set((state) => ({
        drivers: state.drivers.filter((d) => d.id !== id),
      }));
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to delete driver");
      set({ error: message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  resetDetail: () =>
    set({
      currentDriver: null,
      reports: [],
      reportsPagination: emptyPagination,
      orders: [],
      ordersPagination: emptyPagination,
    }),
  invalidate: () => set({ lastFetchTime: null }),
}));
