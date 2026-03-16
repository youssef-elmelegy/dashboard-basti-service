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
import { MoreVertical, Package } from "lucide-react";
import { EditStockDialog } from "./EditStockDialog";

interface BakeryItemsDisplayProps {
  items: BakeryItemStore[];
  bakeryId: string;
  isLoading?: boolean;
}

export function BakeryItemsDisplay({
  items,
  bakeryId,
  isLoading = false,
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("bakeriesManagement.noItems")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t("bakeriesManagement.storedItems")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} onEdit={handleEditClick} />
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedItem && (
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
  onEdit: (item: BakeryItemStore) => void;
}) {
  const { t, i18n } = useTranslation();
  const imageUrl = item.product?.images?.[0];
  const isLowStock = item.stock < 10;
  const isRTL = i18n.language === "ar";

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

        {/* Product Type Badge */}
        {item.product?.type && (
          <Badge
            variant="secondary"
            className={cn(
              "absolute top-2 capitalize",
              isRTL ? "left-2" : "right-2",
            )}
          >
            {item.product.type.replace("_", " ")}
          </Badge>
        )}

        {/* Low Stock Badge */}
        {isLowStock && (
          <Badge
            variant="destructive"
            className={cn("absolute top-2", isRTL ? "right-2" : "left-2")}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {t("bakeriesManagement.lowStock")}
          </Badge>
        )}

        {/* Options Menu */}
        <div className={cn("absolute top-2", isRTL ? "left-2" : "right-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"}>
              <DropdownMenuItem
                onClick={() => onEdit(item)}
                className={isRTL ? "text-right" : "text-left"}
              >
                {t("bakeriesManagement.editStock")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <div className="space-y-1">
          <div
            className={cn(
              "flex items-center",
              isRTL
                ? "flex-row-reverse justify-start gap-2"
                : "justify-between",
            )}
          >
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
        </div>
      </div>
    </div>
  );
}
