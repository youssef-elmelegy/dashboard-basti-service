import type { ProductType } from "../types";

export function getProductEndpoint(
  type: ProductType,
  page: number = 1,
  limit: number = 10,
  search?: string,
): string {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";

  switch (type) {
    case "featured-cake":
      return `/featured-cakes?page=${page}&limit=${limit}${searchParam}`;
    case "addon":
      return `/addons?page=${page}&limit=${limit}${searchParam}`;
    case "flavor":
      return `/custom-cakes/flavors?page=${page}&limit=${limit}${searchParam}`;
    case "shape":
      return `/custom-cakes/shapes?${searchParam}`;
    case "decoration":
      return `/custom-cakes/decorations?page=${page}&limit=${limit}${searchParam}`;
    case "sweet":
      return `/sweets?page=${page}&limit=${limit}${searchParam}`;
    case "predesigned-cake":
      return `/custom-cakes/predesigned-cakes?page=${page}&limit=${limit}${searchParam}`;
    default:
      return "";
  }
}
