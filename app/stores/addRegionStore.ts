import { create } from "zustand";
import type { Region } from "@/data/regions";

export interface AddRegionConfig {
  mode: "add" | "edit";
  initialValue?: string;
  region?: Region;
}

interface AddRegionState {
  isOpen: boolean;
  config: AddRegionConfig | null;
  inputValue: string;
  callback: ((values: Record<string, unknown>) => void) | null;

  // Actions
  openDialog: (
    config: AddRegionConfig,
    onCallback?: (values: Record<string, unknown>) => void,
  ) => void;
  closeDialog: () => void;
  setInputValue: (value: string) => void;
  confirm: () => void;
}

export const useAddRegionStore = create<AddRegionState>((set, get) => ({
  isOpen: false,
  config: null,
  inputValue: "",
  callback: null,

  openDialog: (config, onCallback) => {
    set({
      isOpen: true,
      config,
      inputValue: config.initialValue || "",
      callback: onCallback,
    });
  },

  closeDialog: () => {
    set({
      isOpen: false,
      config: null,
      inputValue: "",
      callback: null,
    });
  },

  setInputValue: (value) => set({ inputValue: value }),

  confirm: () => {
    const { callback, closeDialog } = get();
    if (callback) {
      callback({});
      closeDialog();
    }
  },
}));
