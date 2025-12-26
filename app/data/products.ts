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

export type Sweet = {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  price: number;
  capacity: number; // slots/servings
  isActive: boolean;
  createdAt?: Date;
};

export type AddOn = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: "card" | "balloon" | "candle" | "decoration" | "other";
  price: number;
  tags: string[];
  isActive: boolean;
  createdAt?: Date;
};

export type ReadyCake = {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  basePrice: number;
  capacity: number; // servings
  flavors: string[]; // list of available flavors
  sizes: CakeSize[]; // each size with different price
  isActive: boolean;
  createdAt?: Date;
};
