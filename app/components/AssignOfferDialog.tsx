import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  {
    key: "addonId",
    connectionType: "addon",
    productType: "addons",
    labelKey: "offers.itemTypes.addon",
  },
  {
    key: "featuredCakeId",
    connectionType: "featuredCake",
    productType: "featured-cakes",
    labelKey: "offers.itemTypes.featuredCake",
  },
  {
    key: "sweetId",
    connectionType: "sweet",
    productType: "sweets",
    labelKey: "offers.itemTypes.sweet",
  },
  {
    key: "predesignedCakeId",
    connectionType: "predesignedCake",
    productType: "predesigned-cakes",
    labelKey: "offers.itemTypes.predesignedCake",
  },
  {
    key: "decorationId",
    connectionType: "decoration",
    productType: "decorations",
    labelKey: "offers.itemTypes.decoration",
  },
  {
    key: "flavorId",
    connectionType: "flavor",
    productType: "flavors",
    labelKey: "offers.itemTypes.flavor",
  },
  {
    key: "shapeId",
    connectionType: "shape",
    productType: "shapes",
    labelKey: "offers.itemTypes.shape",
  },
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

  const PAGE_SIZE = 20;

  const [regionId, setRegionId] = useState("");
  const [itemType, setItemType] = useState<OfferItemType | "">("");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [regionalProducts, setRegionalProducts] = useState<RegionalProduct[]>(
    [],
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const listRef = useRef<HTMLUListElement | null>(null);

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

  const selectedTypeConfig = ITEM_TYPES.find((it) => it.key === itemType);
  const selectedProductType = selectedTypeConfig?.productType;

  // Reset accumulated list, selection and page when the user changes
  // region/type — they're now looking at a different list.
  useEffect(() => {
    setSelectedItemIds(new Set());
    setRegionalProducts([]);
    setPage(1);
    setTotalPages(1);
  }, [itemType, regionId]);

  // Fetch one page of regional products restricted to the chosen family and
  // APPEND to the accumulated list. Skips entirely when no region+type yet.
  useEffect(() => {
    if (!regionId || !selectedProductType) return;
    let cancelled = false;
    setIsLoadingProducts(true);
    regionApi
      .getRegionalProducts(regionId, {
        types: [selectedProductType],
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        const incoming = res.data?.items ?? [];
        setRegionalProducts((prev) => {
          // Dedupe by id so a refetch of the same page never duplicates rows.
          const seen = new Set(prev.map((p) => p.id));
          const fresh = incoming.filter((p) => !seen.has(p.id));
          return page === 1 ? incoming : [...prev, ...fresh];
        });
        setTotalPages(res.data?.pagination.totalPages ?? 1);
      })
      .catch(() => {
        if (!cancelled && page === 1) setTotalPages(1);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [regionId, selectedProductType, page]);

  // Infinite scroll: when the user nears the bottom of the list, advance the
  // page. Guarded by isLoadingProducts so we don't fire while a fetch is
  // already in flight.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (isLoadingProducts) return;
      if (page >= totalPages) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 40) {
        setPage((p) => p + 1);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [isLoadingProducts, page, totalPages]);

  useEffect(() => {
    if (!open) {
      setRegionId("");
      setItemType("");
      setSelectedItemIds(new Set());
      setRegionalProducts([]);
      setConnectedItems([]);
    }
  }, [open]);

  const connectedKeySet = useMemo(
    () =>
      new Set(
        connectedItems.map((c) => `${c.regionId}::${c.type}::${c.itemId}`),
      ),
    [connectedItems],
  );

  // Backend already filtered by type, so no client-side .filter — just decorate
  // each row with whether it's already connected to this offer in this region.
  const itemOptions = useMemo(() => {
    if (!selectedTypeConfig) return [];
    return regionalProducts.map((p) => {
      const key = `${regionId}::${selectedTypeConfig.connectionType}::${p.id}`;
      return { ...p, alreadyConnected: connectedKeySet.has(key) };
    });
  }, [regionalProducts, selectedTypeConfig, connectedKeySet, regionId]);

  const canSubmit = !!regionId && !!itemType && selectedItemIds.size > 0;

  const handleSubmit = async () => {
    if (!offer || !canSubmit || !itemType) return;
    // Backend toggle-item takes one item per call; fan out in parallel so the
    // user can attach a whole batch in a single click.
    const ids = Array.from(selectedItemIds);
    await Promise.all(
      ids.map((id) =>
        onSubmit({
          offerId: offer.id,
          regionId,
          [itemType]: id,
        } as ToggleItemOfferPayload),
      ),
    );
    await loadConnectedItems();
    setSelectedItemIds(new Set());
  };

  const toggleItemSelected = (id: string, alreadyConnected: boolean) => {
    if (alreadyConnected) return;
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableIds = useMemo(
    () => itemOptions.filter((o) => !o.alreadyConnected).map((o) => o.id),
    [itemOptions],
  );
  const allSelectableSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedItemIds.has(id));
  const toggleSelectAll = () => {
    setSelectedItemIds((prev) => {
      if (allSelectableSelected) {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      selectableIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleRemoveConnected = (item: OfferItem) => {
    openDeleteDialog(
      {
        title: t("offers.removeConnectionTitle"),
        description: (
          <>
            {t("offers.removeConnectionMessage")}{" "}
            <strong>{item.itemName}</strong> ({item.regionName})?
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
                    <div className="flex items-center justify-between gap-2">
                      <Label>{t("offers.item")}</Label>
                      {selectableIds.length > 0 && (
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-xs text-primary hover:underline"
                        >
                          {allSelectableSelected
                            ? t("common.deselectAll") || "Deselect all"
                            : t("common.selectAll") || "Select all"}
                        </button>
                      )}
                    </div>
                    {isLoadingProducts && itemOptions.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("common.loading")}
                      </div>
                    ) : itemOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">
                        {t("offers.noItemsForRegion")}
                      </p>
                    ) : (
                      <ul
                        ref={listRef}
                        className="max-h-64 overflow-y-auto custom-scrollbar border rounded-md divide-y"
                      >
                        {itemOptions.map((p) => {
                          const checked = selectedItemIds.has(p.id);
                          return (
                            <li key={p.id}>
                              <label
                                className={`flex items-center gap-2 p-2 ${
                                  p.alreadyConnected
                                    ? "opacity-60 cursor-not-allowed"
                                    : "hover:bg-muted/50 cursor-pointer"
                                }`}
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={p.alreadyConnected}
                                  onCheckedChange={() =>
                                    toggleItemSelected(p.id, p.alreadyConnected)
                                  }
                                />
                                <span className="flex-1 text-sm truncate">
                                  {getProductLabel(p)}
                                </span>
                                {p.alreadyConnected && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {t("offers.alreadyConnected")}
                                  </Badge>
                                )}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {isLoadingProducts && itemOptions.length > 0 && (
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t("common.loading")}
                      </div>
                    )}
                    {selectedItemIds.size > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedItemIds.size}{" "}
                        {selectedItemIds.size === 1
                          ? t("offers.itemSelected") || "item selected"
                          : t("offers.itemsSelected") || "items selected"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <SheetFooter className="pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.close")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSaving}
                >
                  {isSaving
                    ? t("common.loading")
                    : selectedItemIds.size > 1
                      ? `${t("offers.addConnection")} (${selectedItemIds.size})`
                      : t("offers.addConnection")}
                </Button>
              </SheetFooter>
            </div>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
