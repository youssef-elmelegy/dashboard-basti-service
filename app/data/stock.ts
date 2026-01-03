/**
 * Stock Management Data
 *
 * Tracks available inventory for add-ons in each bakery-region combination
 */

export type StockLevel = "critical" | "low" | "medium" | "good";

export type AddOnStock = {
  id: string; // Unique identifier (bakeryId-regionId-addOnId)
  bakeryId: string;
  regionId: string;
  regionName: string;
  addOnId: string;
  addOnName: string;
  currentStock: number;
  maxStock: number; // Capacity
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Helper function to determine stock level based on percentage
export const getStockLevel = (current: number, max: number): StockLevel => {
  const percentage = (current / max) * 100;

  if (percentage <= 20) return "critical";
  if (percentage <= 40) return "low";
  if (percentage <= 70) return "medium";
  return "good";
};

// Helper to get color for stock level
export const getStockColor = (level: StockLevel): string => {
  switch (level) {
    case "critical":
      return "bg-red-500";
    case "low":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "good":
      return "bg-green-500";
  }
};

// Helper to get background color for badges
export const getStockBgColor = (level: StockLevel): string => {
  switch (level) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "low":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "good":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  }
};

// Mock initial stock data
export const INITIAL_STOCK_DATA: AddOnStock[] = [
  // Cairo region stocks
  {
    id: "bakery1-cairo-addon1",
    bakeryId: "bakery1",
    regionId: "region1",
    regionName: "Cairo",
    addOnId: "addon1",
    addOnName: "Birthday Card",
    currentStock: 45,
    maxStock: 100,
    lastRestocked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "bakery1-cairo-addon2",
    bakeryId: "bakery1",
    regionId: "region1",
    regionName: "Cairo",
    addOnId: "addon2",
    addOnName: "Red Balloons",
    currentStock: 15,
    maxStock: 80,
    lastRestocked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "bakery1-cairo-addon3",
    bakeryId: "bakery1",
    regionId: "region1",
    regionName: "Cairo",
    addOnId: "addon3",
    addOnName: "Candles Set",
    currentStock: 5,
    maxStock: 50,
    lastRestocked: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  // Alexandria region stocks
  {
    id: "bakery1-alexandria-addon1",
    bakeryId: "bakery1",
    regionId: "region2",
    regionName: "Alexandria",
    addOnId: "addon1",
    addOnName: "Birthday Card",
    currentStock: 60,
    maxStock: 100,
    lastRestocked: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "bakery1-alexandria-addon3",
    bakeryId: "bakery1",
    regionId: "region2",
    regionName: "Alexandria",
    addOnId: "addon3",
    addOnName: "Candles Set",
    currentStock: 35,
    maxStock: 50,
    lastRestocked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];
