import { useState, useEffect } from "react";
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

interface OptionStockEditState {
  optionId: string;
  stock: number;
}

export function EditStockDialog({
  item,
  bakeryId,
  open,
  onOpenChange,
}: EditStockDialogProps) {
  const { t, i18n } = useTranslation();
  const updateItemStock = useBakeryItemStore((state) => state.updateItemStock);
  const isRTL = i18n.language === "ar";

  const isAddonWithOptions =
    item.product?.type === "addon" &&
    item.optionsStock &&
    item.optionsStock.length > 0;

  const [newStock, setNewStock] = useState(item.stock.toString());
  const [optionStocks, setOptionStocks] = useState<OptionStockEditState[]>(
    item.optionsStock?.map((o) => ({
      optionId: o.optionId,
      stock: o.stock,
    })) || [],
  );
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when dialog opens or item changes
  useEffect(() => {
    if (open) {
      setNewStock(item.stock.toString());
      setOptionStocks(
        item.optionsStock?.map((o) => ({
          optionId: o.optionId,
          stock: o.stock,
        })) || [],
      );
    }
  }, [item, open]);

  const handleOptionStockChange = (optionId: string, value: number) => {
    setOptionStocks((prev) =>
      prev.map((opt) =>
        opt.optionId === optionId ? { ...opt, stock: value } : opt,
      ),
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      if (isAddonWithOptions) {
        // For addons with options, send optionsStock with only required fields
        const payload = {
          stock: optionStocks.reduce((sum, opt) => sum + opt.stock, 0),
          optionsStock: optionStocks.map((opt) => ({
            optionId: opt.optionId,
            stock: opt.stock,
          })),
        };
        await updateItemStock(bakeryId, item.id, payload);
      } else {
        // For other items, just send stock number
        const stockValue = parseInt(newStock, 10);
        if (isNaN(stockValue) || stockValue < 0) {
          alert(t("bakeriesManagement.invalidStockValue"));
          setIsLoading(false);
          return;
        }
        await updateItemStock(bakeryId, item.id, stockValue);
      }

      onOpenChange(false);
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
        dir={isRTL ? "rtl" : "ltr"}
        className="w-full sm:max-w-md mx-auto pt-6 flex flex-col"
        style={isRTL ? ({ direction: "rtl" } as React.CSSProperties) : {}}
      >
        {isRTL && (
          <style>{`
            [dir="rtl"] .sheet-close {
              left: 1rem !important;
              right: auto !important;
            }
          `}</style>
        )}
        <SheetHeader className="shrink-0">
          <SheetTitle>{t("bakeriesManagement.editStock")}</SheetTitle>
          <SheetDescription>
            {isAddonWithOptions
              ? t("bakeriesManagement.editOptionsStock")
              : t("bakeriesManagement.enterNewStockValue")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4 px-4 max-h-96 overflow-y-auto">
          {isAddonWithOptions ? (
            // Options Stock Input Fields
            <div className="space-y-6">
              {optionStocks.map((optStock) => {
                const optionData = item.optionsStock?.find(
                  (o) => o.optionId === optStock.optionId,
                );
                return (
                  <div key={optStock.optionId} className="space-y-3">
                    {/* Header with label and value */}
                    <div className="flex flex-col gap-1">
                      <Label className="text-sm font-semibold">
                        {optionData?.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {optionData?.value}
                      </p>
                    </div>
                    {/* Full-width input box */}
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={optStock.stock}
                      onChange={(e) =>
                        handleOptionStockChange(
                          optStock.optionId,
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                      placeholder="0"
                      disabled={isLoading}
                      className="w-full px-4 py-3"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // Regular Stock Input
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
          )}
        </div>

        <SheetFooter className="flex gap-3 pt-4 shrink-0 border-t">
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
