import { create } from 'zustand';
import { chefApi, type Chef, type CreateChefRequest, type UpdateChefRequest } from '@/lib/services/chef.service';

interface ChefStore {
  chefs: Chef[];
  isLoading: boolean;
  error: string | null;
  
  fetchChefs: (page?: number, limit?: number) => Promise<void>;
  addChef: (data: CreateChefRequest) => Promise<void>;
  updateChef: (id: string, data: UpdateChefRequest) => Promise<void>;
  deleteChef: (id: string) => Promise<void>;
  clearError: () => void;
  resetChefs: () => void;
}

export const useChefStore = create<ChefStore>((set) => ({
  chefs: [],
  isLoading: false,
  error: null,

  fetchChefs: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chefApi.getAll(page, limit);
      if (response.success && response.data) {
        set({ chefs: response.data.items, isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch chefs';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addChef: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chefApi.create(data);
      if (response.success && response.data) {
        set((state) => ({
          chefs: [...state.chefs, response.data],
          isLoading: false,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add chef';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateChef: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chefApi.update(id, data);
      if (response.success && response.data) {
        set((state) => ({
          chefs: state.chefs.map((chef) => (chef.id === id ? response.data : chef)),
          isLoading: false,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update chef';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteChef: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chefApi.delete(id);
      if (response.success) {
        set((state) => ({
          chefs: state.chefs.filter((chef) => chef.id !== id),
          isLoading: false,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete chef';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  resetChefs: () => set({ chefs: [], isLoading: false, error: null }),
}));
