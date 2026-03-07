import type { ReactNode } from "react";
import { create } from "zustand";

export interface DeleteConfig {
  recordName: string;
  recordType: string;
  title?: string;
  description?: ReactNode;
  actionType?: "delete" | "block" | "unblock";
}

interface DeleteDialogStore {
  open: boolean;
  config: DeleteConfig | null;
  isLoading: boolean;
  onConfirmCallback: (() => void | Promise<void>) | null;
  openDeleteDialog: (
    config: DeleteConfig,
    onConfirm: () => void | Promise<void>,
  ) => void;
  closeDeleteDialog: () => void;
  setLoading: (loading: boolean) => void;
  confirmDelete: () => void;
}

export const useDeleteDialogStore = create<DeleteDialogStore>((set, get) => ({
  open: false,
  config: null,
  isLoading: false,
  onConfirmCallback: null,

  openDeleteDialog: (config, onConfirm) => {
    set({
      config,
      onConfirmCallback: onConfirm,
      open: true,
      isLoading: false,
    });
  },

  closeDeleteDialog: () => set({ open: false, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  confirmDelete: async () => {
    const cb = get().onConfirmCallback;
    if (cb) {
      set({ isLoading: true });
      try {
        await cb();
      } finally {
        set({ isLoading: false, open: false });
      }
    } else {
      set({ open: false });
    }
  },
}));
