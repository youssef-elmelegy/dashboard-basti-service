import { MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { Sweet } from "@/lib/services/sweet.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SweetCardProps {
  sweet: Sweet;
  onEdit: (sweet: Sweet) => void;
  onDelete: (sweet: Sweet) => void;
  onToggleActive: () => void;
}

export function SweetCard({
  sweet,
  onEdit,
  onDelete,
  onToggleActive,
}: SweetCardProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  const images = Array.isArray(sweet.images) ? sweet.images : [];
  const hasMultiple = images.length > 1;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };

  useEffect(() => {
    setIndex(0);
  }, [images.length]);

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 bg-muted overflow-hidden flex-shrink-0">
        {images.length > 0 ? (
          <>
            <img
              src={images[index]}
              alt={`${sweet.name} ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {hasMultiple && (
              <>
                <button
                  onClick={prev}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={next}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex gap-1">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {t("common.noImage")}
          </div>
        )}

        {/* Action Menu */}
        <div className="absolute top-5 right-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-background/80 hover:bg-background"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(sweet)}>
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(sweet)}
                className="text-destructive focus:text-destructive"
              >
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-grow">
        {/* Title and Tag */}
        <div>
          <h3 className="text-lg font-semibold text-card-foreground mb-1">
            {sweet.name}
          </h3>
          {sweet.tagName && (
            <p className="text-xs text-muted-foreground">{sweet.tagName}</p>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {sweet.description}
        </p>

        {/* Sizes */}
        {sweet.sizes && sweet.sizes.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">
              {t("sweets.sizes")}
            </p>
            <div className="flex flex-wrap gap-1">
              {sweet.sizes.map((size) => (
                <Badge key={size} variant="outline" className="text-xs">
                  {size}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toggle Active Button - Fixed at bottom */}
      <div className="p-4 pt-0 flex-shrink-0">
        <Button
          className="w-full gap-2"
          size="sm"
          variant={sweet.isActive ? "default" : "outline"}
          onClick={onToggleActive}
        >
          {sweet.isActive ? "✓ " : "○ "}
          {sweet.isActive ? t("common.active") : t("common.inactive")}
        </Button>
      </div>
    </div>
  );
}
