import { create } from "zustand";
import {
  configApi,
  type ConfigResponseDto,
  type UpdateConfigRequest,
} from "@/lib/services/config.service";

interface ConfigState {
  // Data
  config: ConfigResponseDto | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  hasLoaded: boolean;

  // Actions
  fetchConfig: () => Promise<void>;
  updateConfig: (data: UpdateConfigRequest) => Promise<void>;
  clearError: () => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  // Initial state
  config: null,
  isLoading: false,
  error: null,
  isSaving: false,
  hasLoaded: false,

  // Fetch config from API only if not already loaded
  fetchConfig: async () => {
    const state = get();

    // Skip if already loaded or currently loading
    if (state.hasLoaded || state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await configApi.getConfig();

      if (response.success && response.data) {
        set({
          config: response.data,
          isLoading: false,
          hasLoaded: true,
        });
      } else {
        throw new Error(response.message || "Failed to fetch config");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch config";
      set({ error: errorMessage, isLoading: false, hasLoaded: true });
      throw error;
    }
  },

  // Update config
  updateConfig: async (data: UpdateConfigRequest) => {
    set({ isSaving: true, error: null });
    try {
      const response = await configApi.updateConfig(data);

      if (response.success && response.data) {
        set({
          config: response.data,
          isSaving: false,
        });
      } else {
        throw new Error(response.message || "Failed to update config");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update config";
      set({ error: errorMessage, isSaving: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset config
  resetConfig: () => {
    set({
      config: null,
      isLoading: false,
      error: null,
      isSaving: false,
      hasLoaded: false,
    });
  },
}));
