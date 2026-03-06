import { create } from "zustand";
import {
  adminService,
  type Admin,
  type CreateAdminPayload,
  type UpdateAdminPayload,
  type BlockAdminPayload,
} from "@/lib/services/admin.service";

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
      const message =
        error instanceof Error ? error.message : "Failed to fetch admins";
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
      const message =
        error instanceof Error ? error.message : "Failed to create admin";
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
      const message =
        error instanceof Error ? error.message : "Failed to update admin";
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
      const message =
        error instanceof Error ? error.message : "Failed to block admin";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteAdmin: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // Block admin instead of delete (soft delete)
      await adminService.block(id, { isBlocked: true });
      set((state) => ({
        admins: state.admins.filter((admin) => admin.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete admin";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
