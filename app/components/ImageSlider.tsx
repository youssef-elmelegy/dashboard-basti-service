import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageSliderProps {
  images: string[];
  labels?: string[];
  square?: boolean;
}

export function ImageSlider({
  images,
  labels,
  square = true,
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3 w-full">
      {/* Main Image Container */}
      <div className="relative w-full overflow-hidden rounded-lg border bg-muted">
        <div
          className={cn(
            "relative overflow-hidden",
            square ? "aspect-square" : "aspect-video",
          )}
        >
          <img
            src={images[currentIndex]}
            alt={labels?.[currentIndex] || `Image ${currentIndex + 1}`}
            className="w-full h-full object-contain transition-opacity duration-300"
          />

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={goToPrevious}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={goToNext}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* Image Counter */}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all",
                currentIndex === idx
                  ? "border-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Labels */}
      {labels && labels[currentIndex] && (
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {labels[currentIndex]}
          </p>
        </div>
      )}
    </div>
  );
}
