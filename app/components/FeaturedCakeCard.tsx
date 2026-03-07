import { MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FeaturedCake } from "@/lib/services/featured-cake.service";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FeaturedCakeCardProps {
  cake: FeaturedCake;
  onEdit: (cake: FeaturedCake) => void;
  onDelete: (cake: FeaturedCake) => void;
  onToggleActive: (id: string) => void;
}

export function FeaturedCakeCard({
  cake,
  onEdit,
  onDelete,
  onToggleActive,
}: FeaturedCakeCardProps) {
  const { t } = useTranslation();
  const images = Array.isArray(cake.images)
    ? cake.images
    : [(cake as unknown as { image: string }).image];

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
      {/* Image Carousel */}
      <div className="w-full h-48 bg-muted/30 relative overflow-hidden flex-shrink-0">
        <ProductImageCarousel images={images} name={cake.name} />

        {/* Action Menu */}
        <div className="absolute top-2 right-2 z-10">
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
              <DropdownMenuItem onClick={() => onEdit(cake)}>
                {t("featuredCakes.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(cake)}
                className="text-destructive focus:text-destructive"
              >
                {t("featuredCakes.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-grow">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground mb-1">
            {cake.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {cake.description}
          </p>
        </div>

        {/* Tag */}
        {cake.tagName && (
          <div>
            <Badge variant="secondary" className="text-xs">
              {cake.tagName}
            </Badge>
          </div>
        )}

        {/* Flavors */}
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Flavors
          </p>
          <div className="flex flex-wrap gap-1">
            {cake.flavorList.map((flavor) => (
              <Badge key={flavor} variant="outline" className="text-xs">
                {flavor}
              </Badge>
            ))}
          </div>
        </div>

        {/* Piping Palettes */}
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Piping Palettes
          </p>
          <div className="flex flex-wrap gap-1">
            {cake.pipingPaletteList.map((palette) => (
              <Badge key={palette} variant="outline" className="text-xs">
                {palette}
              </Badge>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="py-3 border-t border-b border-border text-center">
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Capacity
            </p>
            <p className="text-sm font-semibold text-card-foreground">
              {cake.capacity}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle Status Button - Fixed at bottom */}
      <div className="p-4 pt-0 flex-shrink-0">
        <Button
          className="w-full gap-2"
          size="sm"
          variant={cake.isActive ? "default" : "outline"}
          onClick={() => onToggleActive(cake.id)}
        >
          {cake.isActive
            ? `✓ ${t("featuredCakes.active")}`
            : `○ ${t("featuredCakes.inactive")}`}
        </Button>
      </div>
    </div>
  );
}
