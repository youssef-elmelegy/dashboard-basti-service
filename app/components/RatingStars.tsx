import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toHalfStars } from "@/lib/rating";

/**
 * Five-star rating display with half-star precision.
 *
 * Replaces the per-file `Math.round(rating)` versions this component was
 * extracted from, which snapped to whole stars: a 3.5 average rendered as 4
 * filled stars, overstating it, and every value in [3.5, 4.4] looked identical.
 *
 * Halves are drawn by stacking a clipped filled star over an empty one rather
 * than by using a half-star glyph — lucide has no half-star, and the overlay
 * keeps the two layers in exact alignment at any size.
 */

export function RatingStars({
  rating,
  className,
  starClassName,
}: {
  rating: number;
  className?: string;
  /** Sizing override; defaults to the w-4 h-4 used by the review cards. */
  starClassName?: string;
}) {
  const rounded = toHalfStars(rating);
  const starSize = starClassName ?? "w-4 h-4";

  return (
    <div
      className={cn("flex gap-0.5", className)}
      // The visual is decorative; this is what a screen reader announces.
      role="img"
      aria-label={`${rounded} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = rounded >= star;
        const isHalf = !isFull && rounded >= star - 0.5;

        return (
          <div key={star} className="relative">
            {/* Empty star: always drawn, and acts as the track for the overlay. */}
            <Star className={cn(starSize, "text-muted-foreground")} />

            {(isFull || isHalf) && (
              <span
                className="absolute inset-0 overflow-hidden"
                // Logical inline-size + `inset-0` means the clip starts at the
                // inline start edge, so halves fill left-to-right in English
                // and right-to-left in Arabic without a direction check.
                style={isHalf ? { inlineSize: "50%" } : undefined}
                aria-hidden="true"
              >
                <Star
                  className={cn(starSize, "fill-yellow-400 text-yellow-400")}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default RatingStars;