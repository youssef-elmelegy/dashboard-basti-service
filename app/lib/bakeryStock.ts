/**
 * Rules describing which bakeries keep stock.
 *
 * Only "others" bakeries hold stock — sweets, featured cakes and addons. Big
 * and small cake bakeries build custom cakes to order, so they carry nothing
 * and the API returns no items for them.
 */

const STOCK_CARRYING_TYPES = ["others"];

export function bakeryCarriesStock(types?: string[]): boolean {
  return (types ?? []).some((type) => STOCK_CARRYING_TYPES.includes(type));
}
