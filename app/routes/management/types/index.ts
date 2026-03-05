export type ProductType =
  | "featured-cake"
  | "addon"
  | "flavor"
  | "shape"
  | "decoration"
  | "sweet"
  | "predesigned-cake";

export interface ProductData {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  images?: string[];
  shapeUrl?: string;
  flavorUrl?: string;
  decorationUrl?: string;
  thumbnailUrl?: string;
  mainPrice?: number;
  price?: number | string;
  sizes?: Array<{ name: string; price: number }>;
  sizesPrices?: Record<string, string | number>;
  createdAt?: string | Date;
  tagId?: string;
  tagName?: string;
  flavorList?: string[];
  pipingPaletteList?: string[];
  capacity?: number;
  isActive?: boolean;
  type?: string;
}

export type ProductSelection = {
  type: ProductType;
  product: Omit<ProductData, "price"> & { price?: number };
  selectedSizes?: Array<{ name: string; price: number }>;
} | null;

export type SelectedProductItem = {
  id: string;
  regionId: string;
  regionName: string;
  type: "cake" | "sweet";
  productType?: ProductType;
  productId: string;
  productName: string;
  productImage: string;
  basePrice: number;
  selectedSizes: Array<{ name: string; price: number }>;
  addedAt: Date;
};
