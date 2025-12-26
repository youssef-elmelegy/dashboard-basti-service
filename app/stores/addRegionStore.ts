import { create } from "zustand";

export interface AddRegionConfig {
  mode: "add" | "edit";
  initialValue?: string;
}

interface AddRegionState {
  isOpen: boolean;
  config: AddRegionConfig | null;
  inputValue: string;
  onConfirmCallback: ((name: string) => void) | null;

  // Actions
  openDialog: (
    config: AddRegionConfig,
    onConfirm: (name: string) => void
  ) => void;
  closeDialog: () => void;
  setInputValue: (value: string) => void;
  confirm: () => void;
}

export const useAddRegionStore = create<AddRegionState>((set, get) => ({
  isOpen: false,
  config: null,
  inputValue: "",
  onConfirmCallback: null,

  openDialog: (config, onConfirm) => {
    set({
      isOpen: true,
      config,
      inputValue: config.initialValue || "",
      onConfirmCallback: onConfirm,
    });
  },

  closeDialog: () => {
    set({
      isOpen: false,
      config: null,
      inputValue: "",
      onConfirmCallback: null,
    });
  },

  setInputValue: (value) => set({ inputValue: value }),

  confirm: () => {
    const { inputValue, onConfirmCallback, closeDialog } = get();
    if (inputValue.trim() && onConfirmCallback) {
      onConfirmCallback(inputValue.trim());
      closeDialog();
    }
  },
}));
