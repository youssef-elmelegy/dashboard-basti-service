import type { ReadyCake } from "./products";

export const readyCakesData: ReadyCake[] = [
  {
    id: "cake1",
    name: "Vanilla Dream",
    description: "Classic vanilla cake with vanilla buttercream frosting",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop",
    tags: ["birthday", "anniversary"],
    basePrice: 45,
    capacity: 12,
    flavors: ["Vanilla", "Chocolate", "Strawberry"],
    sizes: [
      { name: "Small (6-8 servings)", price: 45 },
      { name: "Medium (10-12 servings)", price: 65 },
      { name: "Large (14-16 servings)", price: 85 },
    ],
    isActive: true,
  },
  {
    id: "cake2",
    name: "Chocolate Elegance",
    description: "Decadent chocolate cake layers with chocolate ganache",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop",
    tags: ["wedding"],
    basePrice: 55,
    capacity: 16,
    flavors: ["Dark Chocolate", "Milk Chocolate", "White Chocolate"],
    sizes: [
      { name: "Small (6-8 servings)", price: 55 },
      { name: "Medium (10-12 servings)", price: 75 },
      { name: "Large (14-16 servings)", price: 95 },
    ],
    isActive: true,
  },
];
