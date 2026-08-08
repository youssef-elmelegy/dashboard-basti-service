import {
  MapPin,
  Package,
  Star,
  MoreVertical,
  Store,
  StickyNote,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Bakery, type BakeryType } from "@/lib/services/bakery.service";
import { bakeryTypeColor, bakeryTypeLabel } from "@/lib/bakeryTypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface BakeryCardProps {
  bakery: Bakery;
  onEdit: (bakery: Bakery) => void;
  onDelete: (bakery: Bakery) => void;
}

export function BakeryCard({ bakery, onEdit, onDelete }: BakeryCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasExtras = Boolean(
    bakery.notes || (bakery.galleryImages && bakery.galleryImages.length > 0),
  );

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown menu
    if ((e.target as HTMLElement).closest('[role="button"]')) {
      return;
    }
    navigate(`/management/bakeries/${bakery.id}`);
  };

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 relative cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Action Menu */}
      <div className="absolute top-4 end-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(bakery);
              }}
            >
              {t("bakeriesManagement.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(bakery);
              }}
              className="text-destructive focus:text-destructive"
            >
              {t("bakeriesManagement.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header */}
      <div className="mb-4 pe-12 flex items-start gap-3">
        {/* Logo is optional — fall back to a neutral placeholder so cards with
            and without one keep the same layout. */}
        {bakery.logoUrl ? (
          <img
            src={bakery.logoUrl}
            alt={bakery.name}
            className="w-10 h-10 rounded-md object-cover border border-border shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-card-foreground mb-1">
            {bakery.name}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{bakery.locationDescription}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
        <div className="flex items-start gap-2">
          <Package className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              {t("bakeriesManagement.capacity")}
            </p>
            <p className="text-lg font-semibold text-card-foreground">
              {bakery.capacity}
            </p>
          </div>
        </div>
        {bakery.averageRating !== null && (
          <div className="flex items-start gap-2">
            <Star className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0 fill-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {t("bakeriesManagement.rating")}
              </p>
              <p className="text-lg font-semibold text-card-foreground">
                {bakery.averageRating.toFixed(1)} ({bakery.totalReviews})
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Types */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          {t("bakeriesManagement.types")}
        </p>
        <div className="flex flex-wrap gap-2">
          {bakery.types && bakery.types.length > 0 ? (
            bakery.types.map((type: BakeryType) => (
              <Badge
                key={type}
                variant="outline"
                className={cn("text-xs", bakeryTypeColor(type))}
              >
                {bakeryTypeLabel(type, t)}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No types specified</p>
          )}
        </div>
      </div>

      {/* Gallery and notes are secondary detail, so they collapse behind a
          toggle to keep cards uniform in height. Only rendered when the bakery
          actually has one or the other. */}
      {hasExtras && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={(e) => {
              // The whole card navigates on click, so the toggle must not
              // bubble up to it.
              e.stopPropagation();
              setIsExpanded((expanded) => !expanded);
            }}
            aria-expanded={isExpanded}
            className="flex w-full items-center justify-between gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>
              {t("bakeriesManagement.moreDetails", {
                defaultValue: "More details",
              })}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 shrink-0 transition-transform",
                isExpanded && "rotate-180",
              )}
            />
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-4">
              {bakery.galleryImages && bakery.galleryImages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    {t("bakeriesManagement.galleryLabel", {
                      defaultValue: "Photo gallery",
                    })}
                  </p>
                  <div className="flex gap-2">
                    {bakery.galleryImages.map((image, index) => (
                      <img
                        key={image}
                        src={image}
                        alt={`${bakery.name} ${index + 1}`}
                        className="w-14 h-14 rounded-md object-cover border border-border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {bakery.notes && (
                <div className="flex items-start gap-2">
                  <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  {/* `break-all` as well as the clamp: a long note with no
                      spaces has nothing to wrap on and would otherwise stretch
                      the card instead of being truncated. The full text lives
                      on the detail page. */}
                  <p className="text-sm text-muted-foreground line-clamp-2 break-all">
                    {bakery.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
