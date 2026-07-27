import type { ProductType } from "../types";

/**
 * Query params understood by the region detail page. Arriving with `addType`
 * set opens the add-product sheet straight away with that type preselected,
 * which is how "Add Stock" on a bakery deep-links into its region.
 */
export const ADD_TYPE_PARAM = "addType";

const VALID_PRODUCT_TYPES: ProductType[] = [
  "featured-cake",
  "addon",
  "flavor",
  "shape",
  "decoration",
  "sweet",
  "predesigned-cake",
];

/** Builds the region detail URL that opens the add sheet on `productType`. */
export function buildRegionAddProductPath(
  regionId: string,
  productType: ProductType,
): string {
  return `/management/regions/${regionId}?${ADD_TYPE_PARAM}=${productType}`;
}

/**
 * Reads `addType` off the URL, returning it only when it names a real product
 * type — a hand-edited or stale value should be ignored rather than putting
 * the sheet into an unknown state.
 */
export function parseAddTypeParam(value: string | null): ProductType | null {
  if (!value) return null;
  return VALID_PRODUCT_TYPES.includes(value as ProductType)
    ? (value as ProductType)
    : null;
}
