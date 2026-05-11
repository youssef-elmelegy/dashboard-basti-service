import { create } from "zustand";
import {
  adminService,
  type Admin,
  type CreateAdminPayload,
  type UpdateAdminPayload,
  type BlockAdminPayload,
} from "@/lib/services/admin.service";

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
  isLoading: boolean;
  error: string | null;
  isCached: boolean;
  fetchAdmins: (forceRefresh?: boolean) => Promise<void>;
  addAdmin: (payload: CreateAdminPayload) => Promise<void>;
  updateAdmin: (id: string, payload: UpdateAdminPayload) => Promise<void>;
  blockAdmin: (id: string, payload: BlockAdminPayload) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  admins: [],
  isLoading: false,
  error: null,
  isCached: false,

  fetchAdmins: async (forceRefresh = false) => {
    const state = get();

    // Return cached data if available and not forcing refresh
    if (state.isCached && state.admins.length > 0 && !forceRefresh) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const admins = await adminService.getAll();
      set({ admins, isLoading: false, isCached: true });
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to fetch admins");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  addAdmin: async (payload: CreateAdminPayload) => {
    set({ isLoading: true, error: null });
    try {
      const newAdmin = await adminService.create(payload);
      set((state) => ({
        admins: [...state.admins, newAdmin],
        isLoading: false,
      }));
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to create admin");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateAdmin: async (id: string, payload: UpdateAdminPayload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedAdmin = await adminService.update(id, payload);
      set((state) => ({
        admins: state.admins.map((admin) =>
          admin.id === id ? updatedAdmin : admin,
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to update admin");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  blockAdmin: async (id: string, payload: BlockAdminPayload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedAdmin = await adminService.block(id, payload);
      set((state) => ({
        admins: state.admins.map((admin) =>
          admin.id === id ? updatedAdmin : admin,
        ),
        isLoading: false,
      }));
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
      set((state) => ({
        admins: state.admins.filter((admin) => admin.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to delete admin");
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
