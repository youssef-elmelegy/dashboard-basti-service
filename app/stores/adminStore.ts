import { create } from "zustand";
import {
  adminService,
  type Admin,
  type AdminsPagination,
  type CreateAdminPayload,
  type UpdateAdminPayload,
  type BlockAdminPayload,
} from "@/lib/services/admin.service";

const DEFAULT_LIMIT = 10;
const ADMIN_CACHE_DURATION = 60 * 1000;

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

interface AdminStore {
  admins: Admin[];
  pagination: AdminsPagination | null;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  fetchAdmins: (page?: number) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  addAdmin: (payload: CreateAdminPayload) => Promise<void>;
  updateAdmin: (id: string, payload: UpdateAdminPayload) => Promise<void>;
  blockAdmin: (id: string, payload: BlockAdminPayload) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  clearError: () => void;
  invalidate: () => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  admins: [],
  pagination: null,
  page: 1,
  limit: DEFAULT_LIMIT,
  isLoading: false,
  error: null,
  lastFetchTime: null,

  fetchAdmins: async (page = get().page) => {
    const now = Date.now();
    const state = get();
    if (
      state.admins.length > 0 &&
      page === state.page &&
      state.lastFetchTime &&
      now - state.lastFetchTime < ADMIN_CACHE_DURATION
    ) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { items, pagination } = await adminService.getAll({
        page,
        limit: get().limit,
      });
      set({
        admins: items,
        pagination,
        page: pagination.page,
        isLoading: false,
        lastFetchTime: Date.now(),
      });
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to fetch admins");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  goToPage: async (page: number) => {
    const { pagination, isLoading } = get();
    if (isLoading || page < 1) return;
    if (pagination && page > pagination.totalPages) return;
    await get().fetchAdmins(page);
  },

  addAdmin: async (payload: CreateAdminPayload) => {
    set({ isLoading: true, error: null });
    try {
      await adminService.create(payload);
      // New admins sort to the top (newest first), so jump to the first page.
      get().invalidate();
      await get().fetchAdmins(1);
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to create admin");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateAdmin: async (id: string, payload: UpdateAdminPayload) => {
    set({ isLoading: true, error: null });
    try {
      await adminService.update(id, payload);
      get().invalidate();
      await get().fetchAdmins(get().page);
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to update admin");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  blockAdmin: async (id: string, payload: BlockAdminPayload) => {
    set({ isLoading: true, error: null });
    try {
      await adminService.block(id, payload);
      get().invalidate();
      await get().fetchAdmins(get().page);
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to block admin");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteAdmin: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await adminService.delete(id);
      // If the last item on a page is removed, step back to the previous page.
      const { page, admins } = get();
      const nextPage = admins.length <= 1 && page > 1 ? page - 1 : page;
      get().invalidate();
      await get().fetchAdmins(nextPage);
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to delete admin");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  invalidate: () => set({ lastFetchTime: null }),
}));
