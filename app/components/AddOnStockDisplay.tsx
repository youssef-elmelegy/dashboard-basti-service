import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AddOnStock } from "@/data/stock";
import { getStockBgColor } from "@/data/stock";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddOnStockItemProps {
  stock: AddOnStock;
  onEdit: (stock: AddOnStock) => void;
}

export function AddOnStockItem({ stock, onEdit }: AddOnStockItemProps) {
  // Simple critical check: if stock is low (under 20 pieces)
  const isCritical = stock.currentStock < 20;
  const isLow = stock.currentStock < 50;
  const level = isCritical ? "critical" : isLow ? "low" : "good";
  const badgeClass = getStockBgColor(level);

  return (
    <Card
      className={cn(
        isCritical && "border-red-500/50 bg-red-50/50 dark:bg-red-950/10"
      )}
    >
      <CardContent className="pt-6">
        {/* Header with name, stock, and edit button */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">
              {stock.addOnName}
            </h4>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isCritical && (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <Badge className={badgeClass}>{stock.currentStock} pieces</Badge>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2"
              onClick={() => onEdit(stock)}
            >
              Edit
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all rounded-full",
                isCritical
                  ? "bg-red-500"
                  : isLow
                  ? "bg-orange-500"
                  : "bg-green-500"
              )}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AddOnStockGridProps {
  stocks: AddOnStock[];
  onEdit: (stock: AddOnStock) => void;
}

export function AddOnStockGrid({ stocks, onEdit }: AddOnStockGridProps) {
  if (stocks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            No add-ons have been added to this bakery's regions yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by region
  const byRegion = stocks.reduce((acc, stock) => {
    if (!acc[stock.regionName]) {
      acc[stock.regionName] = [];
    }
    acc[stock.regionName].push(stock);
    return acc;
  }, {} as Record<string, AddOnStock[]>);

  return (
    <div className="space-y-6">
      {Object.entries(byRegion).map(([region, regionStocks]) => (
        <div key={region}>
          <h4 className="text-sm font-semibold mb-3 px-1">{region}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {regionStocks.map((stock) => (
              <AddOnStockItem key={stock.id} stock={stock} onEdit={onEdit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
