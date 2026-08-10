/**
 * Rating helpers, kept out of the RatingStars component file so that file
 * exports components only — mixing the two breaks React Fast Refresh.
 */

/**
 * Round a rating to the nearest half star, clamped to 0–5.
 *
 * Halves are what the star row can actually draw, and clamping means an
 * out-of-range value from the API can't render a sixth star.
 */
export function toHalfStars(rating: number): number {
  if (!Number.isFinite(rating)) return 0;
  return Math.min(5, Math.max(0, Math.round(rating * 2) / 2));
}

/**
 * Format a rating for the numeric badge shown beside the stars.
 *
 * Always one decimal, so 4 reads as "4.0" and 3.5 as "3.5". The call sites
 * previously appended a literal ".0", which turned a half rating into "3.5.0"
 * as soon as the data stopped being whole numbers.
 */
export function formatRating(rating: number): string {
  return toHalfStars(rating).toFixed(1);
}