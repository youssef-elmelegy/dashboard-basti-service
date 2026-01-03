export type CakeTag =
  | "birthday"
  | "anniversary"
  | "wedding"
  | "graduation"
  | "engagement"
  | "custom";

export type CakeSize = {
  name: string;
  price: number;
};

export type AddOn = {
  id: string;
  name: string;
  description: string;
  images: string[]; // Multiple images support
  category: "card" | "balloon" | "candle" | "decoration" | "sweets" | "other";
  price: number;
  tags: string[];
  isActive: boolean;
  createdAt?: Date;
};

export type SmallCake = {
  id: string;
  name: string;
  description: string;
  images: string[]; // Multiple images support
  tags: string[];
  basePrice: number;
  capacity: number; // servings
  flavors: string[]; // list of available flavors
  sizes: CakeSize[]; // each size with different price
  isActive: boolean;
  createdAt?: Date;
};
