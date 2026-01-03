import { create } from "zustand";
import { INITIAL_STOCK_DATA, type AddOnStock } from "@/data/stock";

interface StockStore {
  stocks: AddOnStock[];

  // Get all stocks for a specific bakery
  getStocksByBakery: (bakeryId: string) => AddOnStock[];

  // Get stocks for a specific bakery and region
  getStocksByBakeryRegion: (bakeryId: string, regionId: string) => AddOnStock[];

  // Get stock for specific add-on in a region
  getStock: (
    bakeryId: string,
    regionId: string,
    addOnId: string
  ) => AddOnStock | undefined;

  // Update stock quantity
  updateStock: (id: string, currentStock: number) => void;

  // Add new stock entry
  addStock: (stock: AddOnStock) => void;

  // Delete stock entry
  deleteStock: (id: string) => void;

  // Restock (refill to max)
  restock: (id: string) => void;

  // Bulk restock
  bulkRestock: (ids: string[]) => void;
}

export const useStockStore = create<StockStore>((set, get) => ({
  stocks: INITIAL_STOCK_DATA,

  getStocksByBakery: (bakeryId: string) => {
    return get().stocks.filter((stock) => stock.bakeryId === bakeryId);
  },

  getStocksByBakeryRegion: (bakeryId: string, regionId: string) => {
    return get().stocks.filter(
      (stock) => stock.bakeryId === bakeryId && stock.regionId === regionId
    );
  },

  getStock: (bakeryId: string, regionId: string, addOnId: string) => {
    return get().stocks.find(
      (stock) =>
        stock.bakeryId === bakeryId &&
        stock.regionId === regionId &&
        stock.addOnId === addOnId
    );
  },

  updateStock: (id: string, currentStock: number) => {
    set((state) => ({
      stocks: state.stocks.map((stock) =>
        stock.id === id
          ? {
              ...stock,
              currentStock,
              updatedAt: new Date(),
            }
          : stock
      ),
    }));
  },

  addStock: (stock: AddOnStock) => {
    set((state) => ({
      stocks: [...state.stocks, stock],
    }));
  },

  deleteStock: (id: string) => {
    set((state) => ({
      stocks: state.stocks.filter((stock) => stock.id !== id),
    }));
  },

  restock: (id: string) => {
    set((state) => ({
      stocks: state.stocks.map((stock) =>
        stock.id === id
          ? {
              ...stock,
              currentStock: stock.maxStock,
              lastRestocked: new Date(),
              updatedAt: new Date(),
            }
          : stock
      ),
    }));
  },

  bulkRestock: (ids: string[]) => {
    set((state) => ({
      stocks: state.stocks.map((stock) =>
        ids.includes(stock.id)
          ? {
              ...stock,
              currentStock: stock.maxStock,
              lastRestocked: new Date(),
              updatedAt: new Date(),
            }
          : stock
      ),
    }));
  },
}));
