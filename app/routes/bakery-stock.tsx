import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useBakeryItemStore } from "@/stores/bakeryItemStore";
import { useBakeryStore } from "@/stores/bakeryStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft } from "lucide-react";
import { BakeryItemsDisplay } from "@/components/BakeryItemsDisplay";
import type { BakeryItemStore } from "@/lib/services/bakery.service";

const EMPTY_ITEMS: BakeryItemStore[] = [];

const BakeryStockPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const bakeryId = admin?.bakeryId;

  const currentBakery = useBakeryStore((state) => state.currentBakery);
  const getBakeryById = useBakeryStore((state) => state.getBakeryById);

  const bakeryItems = useBakeryItemStore(
    (s) => (bakeryId ? s.itemsByBakery[bakeryId] : undefined) ?? EMPTY_ITEMS,
  );
  const isItemsLoading = useBakeryItemStore((s) => s.isLoading);

  const fetchBakeryItems = useCallback(
    (id: string) => useBakeryItemStore.getState().fetchBakeryItems(id),
    [],
  );

  useEffect(() => {
    if (bakeryId) {
      getBakeryById(bakeryId).catch((err) =>
        console.error("Failed to fetch bakery:", err),
      );
      fetchBakeryItems(bakeryId).catch((err) =>
        console.error("Failed to fetch bakery items:", err),
      );
    }
  }, [bakeryId, getBakeryById, fetchBakeryItems]);

  if (!bakeryId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("bakeryStock.noBakeryLinked") ||
              "No bakery linked to this account."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const bakeryName =
    currentBakery && currentBakery.id === bakeryId ? currentBakery.name : "";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6" />
            {t("bakeryStock.title") || "Stock"}
          </h1>
          {bakeryName && (
            <p className="text-sm text-muted-foreground mt-1">{bakeryName}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/orders/bakery/${bakeryId}`)}
        >
          <ArrowLeft className="w-4 h-4 me-1" />
          {t("bakeryOrders.backToActive") || "Back to orders"}
        </Button>
      </div>

      <BakeryItemsDisplay
        items={bakeryItems}
        bakeryId={bakeryId}
        isLoading={isItemsLoading}
        bakeryTypes={
          currentBakery && currentBakery.id === bakeryId
            ? currentBakery.types
            : undefined
        }
        readOnly
      />
    </div>
  );
};

export default BakeryStockPage;
