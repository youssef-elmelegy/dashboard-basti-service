export type CakeTag =
  | "birthday"
  | "anniversary"
  | "wedding"
  | "graduation"
  | "engagement"
  | "custom";

export type CakeSize = {
  size: string;
  price: number;
};

export type AddOn = {
  id: string;
  name: string;
  description: string;
  images: string[]; // Multiple images support
  category: "balloons" | "cards" | "candles" | "decorations" | "other";
  price?: number;
  tags?: string[];
  tagId?: string;
  tagName?: string;
  /** Set by the API when tagId points at a tag that has been deleted. */
  tagMissing?: boolean;
  isActive: boolean;
  isFeatured?: boolean;
  options?: Array<{
    id?: string;
    type: "color" | "number" | "letter" | "text";
    label: string;
    value: string;
    imageUrl?: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SmallCake = {
  id: string;
  name: string;
  description: string;
  images: string[]; // Multiple images support
  tags: string[];
  mainPrice: number;
  capacity: number; // servings
  flavors: string[]; // list of available flavors
  sizes: CakeSize[]; // each size with different price
  isActive: boolean;
  createdAt?: Date;
};
