/**
 * Bakeries Data
 *
 * This is mock data that demonstrates the structure.
 *
 * In production, this would come from:
 * 1. API call: const bakeries = await fetch('/api/bakeries')
 * 2. Caching layer (React Query, SWR, Redux, etc.)
 * 3. Server component with revalidation
 *
 * The pattern allows:
 * - Shared data across pages (Bakeries, Chefs, Orders, etc.)
 * - Single source of truth for bakery list
 * - Easy integration with real API later
 * - Caching strategies at the data layer
 */

export type BakeryType =
  | "basket_cakes"
  | "midume"
  | "small_cakes"
  | "large_cakes"
  | "custom";

export type Bakery = {
  id: string;
  name: string;
  location: string;
  regions: string[];
  capacity: number;
  employees: number;
  types: BakeryType[];
};

export const BAKERIES_DATA: Bakery[] = [
  {
    id: "bakery1",
    name: "Sweet Cairo Bakery",
    location: "12 El-Maadi St, Cairo",
    regions: ["Cairo"],
    capacity: 50,
    employees: 15,
    types: ["basket_cakes", "midume", "large_cakes"],
  },
  {
    id: "bakery2",
    name: "Alex Pastry House",
    location: "45 Sporting Club, Alexandria",
    regions: ["Alexandria"],
    capacity: 60,
    employees: 10,
    types: ["small_cakes", "midume", "custom"],
  },
  {
    id: "bakery3",
    name: "Giza Cake Factory",
    location: "23 El-Gomhoria St, Giza",
    regions: ["Giza"],
    capacity: 30,
    employees: 12,
    types: ["large_cakes", "custom", "basket_cakes"],
  },
  {
    id: "bakery4",
    name: "Aswan Sweets",
    location: "78 Nile Corniche, Aswan",
    regions: ["Aswan"],
    capacity: 25,
    employees: 8,
    types: ["small_cakes", "midume"],
  },
  {
    id: "bakery5",
    name: "Delta Cakes Group",
    location: "Main Road, Cairo & Giza",
    regions: ["Cairo", "Giza"],
    capacity: 35,
    employees: 20,
    types: ["large_cakes", "custom", "basket_cakes", "midume"],
  },
  {
    id: "bakery6",
    name: "Nile Confectionery",
    location: "Riverfront, Aswan & Cairo",
    regions: ["Aswan", "Cairo"],
    capacity: 90,
    employees: 11,
    types: ["small_cakes", "midume", "custom"],
  },
  {
    id: "bakery7",
    name: "Mediterranean Bakes",
    location: "Seaside, Alexandria & Giza",
    regions: ["Alexandria", "Giza"],
    capacity: 100,
    employees: 9,
    types: ["basket_cakes", "small_cakes"],
  },
];
