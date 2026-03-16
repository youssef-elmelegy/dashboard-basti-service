import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BakeryItemStore } from "@/lib/services/bakery.service";
import { useBakeryItemStore } from "@/stores/bakeryItemStore";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditStockDialogProps {
  item: BakeryItemStore;
  bakeryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStockDialog({
  item,
  bakeryId,
  open,
  onOpenChange,
}: EditStockDialogProps) {
  const { t, i18n } = useTranslation();
  const updateItemStock = useBakeryItemStore((state) => state.updateItemStock);

  const [newStock, setNewStock] = useState(item.stock.toString());
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const stockValue = parseInt(newStock, 10);

    if (isNaN(stockValue) || stockValue < 0) {
      alert(t("bakeriesManagement.invalidStockValue"));
      return;
    }

    setIsLoading(true);

    try {
      await updateItemStock(bakeryId, item.id, stockValue);

      onOpenChange(false);
      setNewStock(item.stock.toString());
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : t("bakeriesManagement.updateStockError");
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        dir={i18n.language === "ar" ? "rtl" : "ltr"}
        className="w-full sm:max-w-md mx-auto pt-6"
        style={
          i18n.language === "ar"
            ? ({ direction: "rtl" } as React.CSSProperties)
            : {}
        }
      >
        {i18n.language === "ar" && (
          <style>{`
            [dir="rtl"] .sheet-close {
              left: 1rem !important;
              right: auto !important;
            }
          `}</style>
        )}
        <SheetHeader>
          <SheetTitle>{t("bakeriesManagement.editStock")}</SheetTitle>
          <SheetDescription>
            {t("bakeriesManagement.enterNewStockValue")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4 px-4">
          {/* Stock Input */}
          <div className="space-y-2">
            <Label htmlFor="stock">{t("bakeriesManagement.newStock")}</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              step="1"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="0"
              disabled={isLoading}
              className="px-4 py-3"
            />
          </div>
        </div>

        <SheetFooter className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : t("bakeriesManagement.editStock")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
