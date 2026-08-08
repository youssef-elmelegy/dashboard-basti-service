/**
 * Display rules for bakery type values.
 *
 * `bakery_types` is stored as untyped jsonb, so records can carry values
 * outside the current vocabulary. `large_cakes` is a legacy alias for
 * `big_cakes` still present in older records; anything else unrecognised
 * degrades to a humanised form of the raw value rather than leaking a
 * translation key into the UI.
 */

/** Maps a stored bakery type value to its key under `bakeriesManagement`. */
const BAKERY_TYPE_LABEL_KEYS: Record<string, string> = {
  small_cakes: "smallCakes",
  big_cakes: "bigCakes",
  large_cakes: "bigCakes",
  others: "othersType",
};

/** Badge colours, keyed the same way so legacy values stay colour-consistent. */
const BAKERY_TYPE_COLOR_KEYS: Record<string, string> = {
  small_cakes: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  big_cakes: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  large_cakes: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  others: "bg-teal-500/10 text-teal-500 border-teal-500/20",
};

/** Humanised fallback for a value with no known translation. */
export function humaniseBakeryType(type: string): string {
  return type.replace(/_/g, " ");
}

/**
 * Resolves a bakery type to a translated label, falling back to the humanised
 * raw value. `t` is passed in so callers keep their own i18n instance.
 */
export function bakeryTypeLabel(
  type: string,
  t: (key: string, options?: { defaultValue: string }) => string,
): string {
  const labelKey = BAKERY_TYPE_LABEL_KEYS[type];
  if (!labelKey) return humaniseBakeryType(type);
  return t(`bakeriesManagement.${labelKey}`, {
    defaultValue: humaniseBakeryType(type),
  });
}

/** Resolves a bakery type to its badge colour classes, or none if unknown. */
export function bakeryTypeColor(type: string): string {
  return BAKERY_TYPE_COLOR_KEYS[type] ?? "";
}
