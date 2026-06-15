/**
 * Centralized upload-folder paths.
 *
 * Every image uploaded through `/uploads/image?folder=...` lives under the
 * `basti/` namespace. Use these constants instead of hard-coded strings so
 * the storage layout stays consistent across the app.
 */
export const UPLOAD_FOLDERS = {
  general: "basti/general",
  bakeries: "basti/bakeries",
  regions: "basti/regions",
  sliders: "basti/sliders",
  chefs: "basti/chefs",
  admins: "basti/admins",
  drivers: "basti/drivers",
  featuredCakes: "basti/featured-cakes",
  cakes: "basti/cakes",
  shapes: "basti/shapes",
  decorations: "basti/decorations",
  decorationVariants: "basti/decoration-variants",
  flavors: "basti/flavors",
  flavorVariants: "basti/flavor-variants",
  addOns: "basti/addons",
  sweets: "basti/sweets",
  orders: "basti/orders",
  qa: "basti/qa",
} as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[keyof typeof UPLOAD_FOLDERS];
