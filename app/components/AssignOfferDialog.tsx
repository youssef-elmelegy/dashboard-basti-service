import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDeleteDialog } from "@/components/useDeleteDialog";
import { useRegionStore } from "@/stores/regionStore";
import {
  regionApi,
  type RegionalProduct,
  type RegionalProductType,
} from "@/lib/services/region.service";
import {
  offerApi,
  type Offer,
  type OfferItem,
  type OfferItemConnectionType,
  type OfferItemType,
  type ToggleItemOfferPayload,
} from "@/lib/services/offer.service";

interface AssignOfferDialogProps {
  offer: Offer | null;
  open: boolean;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ToggleItemOfferPayload) => Promise<void>;
}

const ITEM_TYPES: {
  key: OfferItemType;
  connectionType: OfferItemConnectionType;
  productType: RegionalProductType;
  labelKey: string;
}[] = [
  { key: "addonId", connectionType: "addon", productType: "addons", labelKey: "offers.itemTypes.addon" },
  { key: "featuredCakeId", connectionType: "featuredCake", productType: "featured-cakes", labelKey: "offers.itemTypes.featuredCake" },
  { key: "sweetId", connectionType: "sweet", productType: "sweets", labelKey: "offers.itemTypes.sweet" },
  { key: "predesignedCakeId", connectionType: "predesignedCake", productType: "predesigned-cakes", labelKey: "offers.itemTypes.predesignedCake" },
  { key: "decorationId", connectionType: "decoration", productType: "decorations", labelKey: "offers.itemTypes.decoration" },
  { key: "flavorId", connectionType: "flavor", productType: "flavors", labelKey: "offers.itemTypes.flavor" },
  { key: "shapeId", connectionType: "shape", productType: "shapes", labelKey: "offers.itemTypes.shape" },
];

function connectionTypeToKey(type: OfferItemConnectionType): OfferItemType {
  return ITEM_TYPES.find((it) => it.connectionType === type)!.key;
}

function connectionTypeLabelKey(type: OfferItemConnectionType): string {
  return ITEM_TYPES.find((it) => it.connectionType === type)!.labelKey;
}

function getProductLabel(p: RegionalProduct): string {
  return (
    (typeof p.name === "string" && p.name) ||
    (typeof p.title === "string" && p.title) ||
    p.id
  );
}

export default function AssignOfferDialog({
  offer,
  open,
  isSaving,
  onOpenChange,
  onSubmit,
}: AssignOfferDialogProps) {
  const { t } = useTranslation();

  const [regionId, setRegionId] = useState("");
  const [itemType, setItemType] = useState<OfferItemType | "">("");
  const [itemId, setItemId] = useState("");
  const [regionalProducts, setRegionalProducts] = useState<RegionalProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [connectedItems, setConnectedItems] = useState<OfferItem[]>([]);
  const [isLoadingConnected, setIsLoadingConnected] = useState(false);

  const regions = useRegionStore((s) => s.regions);
  const fetchRegions = useRegionStore((s) => s.fetchRegions);

  const { openDeleteDialog } = useDeleteDialog();

  const loadConnectedItems = useCallback(async () => {
    if (!offer) return;
    setIsLoadingConnected(true);
    try {
      const res = await offerApi.getItems(offer.id);
      setConnectedItems(res.data ?? []);
    } catch {
      setConnectedItems([]);
    } finally {
      setIsLoadingConnected(false);
    }
  }, [offer]);

  useEffect(() => {
    if (!open) return;
    fetchRegions();
    loadConnectedItems();
  }, [open, fetchRegions, loadConnectedItems]);

  useEffect(() => {
    if (!regionId) {
      setRegionalProducts([]);
      return;
    }
    let cancelled = false;
    setIsLoadingProducts(true);
    regionApi
      .getRegionalProducts(regionId)
      .then((res) => {
        if (!cancelled) setRegionalProducts(res.data?.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setRegionalProducts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  useEffect(() => {
    setItemId("");
  }, [itemType, regionId]);

  useEffect(() => {
    if (!open) {
      setRegionId("");
      setItemType("");
      setItemId("");
      setRegionalProducts([]);
      setConnectedItems([]);
    }
  }, [open]);

  const selectedTypeConfig = ITEM_TYPES.find((it) => it.key === itemType);

  const connectedKeySet = useMemo(
    () => new Set(connectedItems.map((c) => `${c.regionId}::${c.type}::${c.itemId}`)),
    [connectedItems],
  );

  const itemOptions = useMemo(() => {
    if (!selectedTypeConfig) return [];
    return regionalProducts
      .filter((p) => p.type === selectedTypeConfig.productType)
      .map((p) => {
        const key = `${regionId}::${selectedTypeConfig.connectionType}::${p.id}`;
        return { ...p, alreadyConnected: connectedKeySet.has(key) };
      });
  }, [regionalProducts, selectedTypeConfig, connectedKeySet, regionId]);

  const canSubmit = !!regionId && !!itemType && !!itemId;

  const handleSubmit = async () => {
    if (!offer || !canSubmit || !itemType) return;
    const payload: ToggleItemOfferPayload = {
      offerId: offer.id,
      regionId,
      [itemType]: itemId,
    };
    await onSubmit(payload);
    await loadConnectedItems();
    setItemId("");
  };

  const handleRemoveConnected = (item: OfferItem) => {
    openDeleteDialog(
      {
        title: t("offers.removeConnectionTitle"),
        description: (
          <>
            {t("offers.removeConnectionMessage")}{" "}
            <strong>{item.itemName}</strong>
            {" "}
            ({item.regionName})?
          </>
        ),
        recordName: item.itemName,
        recordType: t("offers.connectionRecordType"),
      },
      async () => {
        const payload: ToggleItemOfferPayload = {
          regionId: item.regionId,
          [connectionTypeToKey(item.type)]: item.itemId,
        };
        await onSubmit(payload);
        await loadConnectedItems();
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto py-6">
        <SheetHeader>
          <SheetTitle>
            {t("offers.assignTitle")} — {offer?.name}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="space-y-6 mt-4">
              {/* Connected items list */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  {t("offers.connectedItems")}
                </Label>
                {isLoadingConnected ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("common.loading")}
                  </div>
                ) : connectedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("offers.noConnectedItems")}
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar border rounded-md p-2">
                    {connectedItems.map((item) => (
                      <li
                        key={`${item.regionId}-${item.type}-${item.itemId}`}
                        className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {item.itemName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {t(connectionTypeLabelKey(item.type))}
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">
                              {item.regionName}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveConnected(item)}
                          disabled={isSaving}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                          title={t("common.remove")}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <Label className="text-base font-semibold">
                  {t("offers.addNewConnection")}
                </Label>

                <div className="space-y-2">
                  <Label>{t("offers.region")}</Label>
                  <Select value={regionId} onValueChange={setRegionId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("offers.selectRegion")} />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("offers.itemType")}</Label>
                  <Select
                    value={itemType}
                    onValueChange={(v) => setItemType(v as OfferItemType)}
                    disabled={!regionId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("offers.selectItemType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map(({ key, labelKey }) => (
                        <SelectItem key={key} value={key}>
                          {t(labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {itemType && (
                  <div className="space-y-2">
                    <Label>{t("offers.item")}</Label>
                    {isLoadingProducts ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("common.loading")}
                      </div>
                    ) : (
                      <Select value={itemId} onValueChange={setItemId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("offers.selectItem")} />
                        </SelectTrigger>
                        <SelectContent>
                          {itemOptions.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              {t("offers.noItemsForRegion")}
                            </div>
                          ) : (
                            itemOptions.map((p) => (
                              <SelectItem
                                key={p.id}
                                value={p.id}
                                disabled={p.alreadyConnected}
                              >
                                <span className="flex items-center gap-2">
                                  {getProductLabel(p)}
                                  {p.alreadyConnected && (
                                    <Badge variant="secondary" className="text-xs">
                                      {t("offers.alreadyConnected")}
                                    </Badge>
                                  )}
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>

              <SheetFooter className="pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.close")}
                </Button>
                <Button onClick={handleSubmit} disabled={!canSubmit || isSaving}>
                  {isSaving ? t("common.loading") : t("offers.addConnection")}
                </Button>
              </SheetFooter>
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
