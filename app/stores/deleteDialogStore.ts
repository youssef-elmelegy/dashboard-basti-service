import { create } from "zustand";

export interface DeleteConfig {
  recordName: string;
  recordType: string;
  title?: string;
  description?: string;
  actionType?: "delete" | "block" | "unblock";
}

interface DeleteDialogStore {
  open: boolean;
  config: DeleteConfig | null;
  isLoading: boolean;
  onConfirmCallback: (() => void) | null;
  openDeleteDialog: (config: DeleteConfig, onConfirm: () => void) => void;
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
    set({ isLoading: true });
    try {
      const cb = get().onConfirmCallback;
      if (cb) cb();
    } finally {
      set({ isLoading: false, open: false });
    }
  },
}));
