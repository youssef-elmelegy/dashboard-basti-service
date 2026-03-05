import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ProductImageCarouselProps {
  images: string[];
  name: string;
  onImageChange?: (imageUrl: string, index: number) => void;
}

export function ProductImageCarousel({
  images,
  name,
  onImageChange,
}: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Safety check: handle empty or undefined images
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-muted flex items-center justify-center rounded-md">
        <span className="text-muted-foreground text-sm">
          No image available
        </span>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onImageChange?.(images[newIndex], newIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onImageChange?.(images[newIndex], newIndex);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    onImageChange?.(images[index], index);
  };

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative w-full h-48 bg-muted overflow-hidden rounded-lg group flex items-center justify-center">
        <HoverCard>
          <HoverCardTrigger asChild>
            <img
              src={currentImage}
              alt={`${name} - Image ${currentIndex + 1}`}
              className="w-full h-full object-contain hover:scale-105 transition-transform cursor-pointer"
            />
          </HoverCardTrigger>
          <HoverCardContent side="right" className="w-auto p-2">
            <img
              src={currentImage}
              alt={name}
              className="max-w-sm h-auto rounded-md"
            />
          </HoverCardContent>
        </HoverCard>

        {/* Navigation Buttons - Show only if multiple images */}
        {images.length > 1 && (
          <>
            {/* Previous Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Next Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Navigation - Show only if multiple images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`relative shrink-0 w-12 h-12 rounded border-2 transition-all overflow-hidden ${
                currentIndex === index
                  ? "border-primary ring-2 ring-primary/50"
                  : "border-border hover:border-primary/50"
              }`}
              title={`Image ${index + 1}`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
