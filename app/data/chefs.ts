/**
 * Chefs Data
 *
 * This is mock data that demonstrates the structure.
 *
 * In production, this would come from:
 * 1. API call: const chefs = await fetch('/api/chefs')
 * 2. Caching layer (Zustand, React Query, SWR, etc.)
 * 3. Server component with revalidation
 *
 * The pattern allows:
 * - Shared data across pages (Chefs, Orders, Dashboard, etc.)
 * - Single source of truth for chef list
 * - Easy integration with real API later
 * - Caching strategies at the data layer
 */

export type Chef = {
  id: string;
  name: string;
  image: string;
  bakery: string;
  rating: number;
};

export const CHEFS_DATA: Chef[] = [
  {
    id: "chef001",
    name: "John Anderson",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    bakery: "Main Bakery",
    rating: 4.8,
  },
  {
    id: "chef002",
    name: "Sarah Johnson",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    bakery: "Downtown Bakery",
    rating: 4.9,
  },
  {
    id: "chef003",
    name: "Michael Brown",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    bakery: "Main Bakery",
    rating: 4.7,
  },
  {
    id: "chef004",
    name: "Emily Davis",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    bakery: "Uptown Bakery",
    rating: 4.6,
  },
  {
    id: "chef005",
    name: "David Wilson",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    bakery: "Downtown Bakery",
    rating: 4.8,
  },
  {
    id: "chef006",
    name: "Jessica Martinez",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
    bakery: "Main Bakery",
    rating: 4.9,
  },
  {
    id: "chef007",
    name: "Robert Taylor",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
    bakery: "Uptown Bakery",
    rating: 4.5,
  },
  {
    id: "chef008",
    name: "Lisa Anderson",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    bakery: "Main Bakery",
    rating: 4.7,
  },
];
