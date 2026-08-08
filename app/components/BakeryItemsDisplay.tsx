import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { BakeryItemStore } from "@/lib/services/bakery.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Package,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { EditStockDialog } from "./EditStockDialog";
import { bakeryCarriesStock } from "@/lib/bakeryStock";
import { bakeryTypeLabel } from "@/lib/bakeryTypes";

interface BakeryItemsDisplayProps {
  items: BakeryItemStore[];
  bakeryId: string;
  isLoading?: boolean;
  readOnly?: boolean;
  /** Rendered in the card header, e.g. an "Add Stock" button. */
  headerAction?: React.ReactNode;
  /**
   * The bakery's declared types (e.g. `["big_cakes"]`). Used only to name the
   * bakery in the empty state — stock is not filtered by type anywhere in the
   * stack, so this never changes which items render.
   */
  bakeryTypes?: string[];
}

export function BakeryItemsDisplay({
  items,
  bakeryId,
  isLoading = false,
  readOnly = false,
  headerAction,
  bakeryTypes,
}: BakeryItemsDisplayProps) {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<BakeryItemStore | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (item: BakeryItemStore) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  // Shared across the loading / empty / populated states so the header action
  // (e.g. "Add Stock") stays reachable even when there is nothing to show.
  const header = (
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          {t("bakeriesManagement.storedItems")}
        </CardTitle>
        {headerAction}
      </div>
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card>
        {header}
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    const carriesStock = bakeryCarriesStock(bakeryTypes);
    const typeLabels = (bakeryTypes ?? [])
      .map((type) => bakeryTypeLabel(type, t))
      .filter(Boolean);

    return (
      <Card>
        {header}
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border/70 bg-muted/20 px-6 py-12">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted/60 mb-4">
              <PackageOpen className="w-7 h-7 text-muted-foreground" />
            </div>

            {/* A bakery that carries no stock by type is a permanent state, not
                an empty one — say so instead of inviting the user to add stock. */}
            {bakeryTypes && !carriesStock ? (
              <>
                <p className="text-base font-semibold">
                  {typeLabels.length > 0
                    ? t("bakeriesManagement.typeHasNoStore", {
                        types: typeLabels.join(" / "),
                        defaultValue:
                          "{{types}} bakeries don't have a store",
                      })
                    : t("bakeriesManagement.noStoreGeneric", {
                        defaultValue: "This bakery doesn't have a store",
                      })}
                </p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  {t("bakeriesManagement.typeHasNoStoreHint", {
                    defaultValue:
                      "These bakeries prepare cakes to order, so no stock is kept for them.",
                  })}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold">
                  {t("bakeriesManagement.noStoreGeneric", {
                    defaultValue: "This bakery doesn't have a store yet",
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  {readOnly
                    ? t("bakeriesManagement.noStoreHintReadOnly", {
                        defaultValue:
                          "No stock has been assigned to this bakery yet.",
                      })
                    : t("bakeriesManagement.noStoreHint", {
                        defaultValue:
                          "Use “Add Stock” to assign products from this bakery's region.",
                      })}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        {header}
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={readOnly ? undefined : handleEditClick}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {!readOnly && selectedItem && (
        <EditStockDialog
          item={selectedItem}
          bakeryId={bakeryId}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}

function ItemCard({
  item,
  onEdit,
}: {
  item: BakeryItemStore;
  onEdit?: (item: BakeryItemStore) => void;
}) {
  const { t, i18n } = useTranslation();
  const imageUrl = item.product?.images?.[0];
  const isLowStock = item.stock < 10;
  const isRTL = i18n.language === "ar";
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);

  const hasOptions =
    item.product?.type === "addon" && (item.optionsStock?.length ?? 0) > 0;
  const currentOption = hasOptions
    ? (item.optionsStock?.[currentOptionIndex] ?? null)
    : null;

  const handlePrevOption = () => {
    const len = item.optionsStock?.length ?? 0;
    if (hasOptions && len > 0) {
      setCurrentOptionIndex((prev) => (prev === 0 ? len - 1 : prev - 1));
    }
  };

  const handleNextOption = () => {
    const len = item.optionsStock?.length ?? 0;
    if (hasOptions && len > 0) {
      setCurrentOptionIndex((prev) => (prev === len - 1 ? 0 : prev + 1));
    }
  };

  return (
    <div
      className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Image Section */}
      <div className="relative w-full h-40 bg-muted overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.product?.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Low Stock Badge */}
        {isLowStock && (
          <Badge
            variant="destructive"
            className="absolute top-2 start-2 max-w-[calc(50%-0.5rem)] truncate"
          >
            {t("bakeriesManagement.lowStock")}
          </Badge>
        )}

        {/* Type badge and options menu share one row so they can't overlap. */}
        <div className="absolute top-2 end-2 flex items-center gap-1 max-w-[calc(50%-0.5rem)]">
          {item.product?.type && (
            <Badge variant="secondary" className="capitalize truncate">
              {item.product.type.replace("_", " ")}
            </Badge>
          )}

          {onEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0 bg-background/80 hover:bg-background"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"}>
                <DropdownMenuItem
                  onClick={() => onEdit(item)}
                  className="text-start"
                >
                  {t("bakeriesManagement.editStock")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-2">
        <div>
          <h3
            className="font-semibold text-sm line-clamp-2"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {item.product?.name || "Unknown Item"}
          </h3>
          <p
            className="text-xs text-muted-foreground line-clamp-1"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {item.product?.description}
          </p>
        </div>

        {/* Stock Info */}
        <div className="space-y-2">
          {/* Show total stock only for non-addon items or addons without options */}
          {item.product?.type !== "addon" || !item.optionsStock?.length ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("bakeriesManagement.stock")}:
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  isLowStock ? "text-destructive" : "text-foreground",
                )}
              >
                {item.stock}
              </span>
            </div>
          ) : null}

          {/* Show horizontal options stock for addons with options */}
          {hasOptions && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground block">
                {t("bakeriesManagement.optionsStock")}:
              </span>

              {/* Single Option Carousel */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={handlePrevOption}
                  disabled={(item.optionsStock?.length ?? 0) <= 1}
                >
                  {isRTL ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>

                {/* Option Display */}
                {currentOption && (
                  <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded p-2">
                    {/* Option Image */}
                    {currentOption.imageUrl ? (
                      <img
                        src={currentOption.imageUrl}
                        alt={currentOption.label}
                        className="w-8 h-8 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}

                    {/* Option Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium truncate flex-1">
                          {currentOption.label}
                        </span>
                        <span className="text-sm font-semibold text-primary shrink-0">
                          {currentOption.stock}
                        </span>
                      </div>
                      {(item.optionsStock?.length ?? 0) > 1 && (
                        <p className="text-xs text-muted-foreground leading-tight">
                          {currentOptionIndex + 1} /{" "}
                          {item.optionsStock?.length ?? 0}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Next Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={handleNextOption}
                  disabled={(item.optionsStock?.length ?? 0) <= 1}
                >
                  {isRTL ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
