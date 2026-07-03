import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { env } from "@/config/env";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { OrdersSidebarRight } from "@/components/orders-sidebar-right";
import { useBakeryStore } from "@/stores/bakeryStore";
import { useAssignedOrdersStore } from "@/stores/assignedOrdersStore";
import { useUnassignedOrdersStore } from "@/stores/unassignedOrdersStore";
import type { Order } from "@/data/orders";
import type { Bakery } from "@/lib/services/bakery.service";
import { orderApi } from "@/lib/services/order.service";
import { convertApiResponseToOrder } from "@/stores/orderStore";
import { httpRequest } from "@/lib/http-handler";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyReferenceButton } from "@/components/CopyReferenceButton";
import {
  CalendarIcon,
  Package,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  ClipboardPaste,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  preparing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  out_for_delivery: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const orderTypeColors: Record<string, string> = {
  big_cakes: "bg-rose-500/10",
  small_cakes: "bg-amber-500/10",
  others: "bg-teal-500/10",
};

function getOrderTypeStyle(orderType?: string): string {
  if (!orderType) return "";
  return orderTypeColors[orderType] || "bg-teal-500/10";
}

function SortableOrderCard({
  order,
  t,
}: {
  order: Order;
  t: (key: string) => string;
}) {
  const navigate = useNavigate();
  const [isDragActive, setIsDragActive] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
    data: {
      type: "order",
      order,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    // Only navigate if not dragging
    if (!isDragActive && !isDragging) {
      navigate(`/orders/${order.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onMouseDown={() => setIsDragActive(false)}
    >
      <Card
        className={cn(
          "hover:shadow-md transition-all cursor-grab active:cursor-grabbing border",
          getOrderTypeStyle(order.type),
          isDragging && "opacity-50",
        )}
        onClick={handleClick}
        {...listeners}
      >
        <CardHeader className="py-0 px-3">
          <div className="space-y-0">
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/orders/${order.id}`);
                }}
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors w-fit cursor-pointer"
                title={`Click to view order ${order.referenceNumber || order.id}`}
              >
                {order.referenceNumber || `#${order.id}`}
              </button>
              <CopyReferenceButton
                value={order.referenceNumber || order.id}
                title={t("orders.copyReference")}
              />
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">
                  {formatProductName(order.productName, t)}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span className="truncate">{order.customerName}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                <Badge variant="outline" className="text-xs">
                  {formatBakeryType(order.type, t)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusColors[order.status])}
                >
                  {formatOrderStatus(order.status, t)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>
                  {(() => {
                    const dateStr = order.orderedAt || order.deliverDay;
                    try {
                      return format(new Date(dateStr), "MMM d");
                    } catch {
                      return "-";
                    }
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                <span>
                  {order.capacitySlots} {t("orders.slots")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                {order.region}
              </span>
              <span className="text-sm font-semibold">
                {order.totalPrice} {t("common.currency")}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

// Get capacity color based on percentage
function getCapacityColor(percentage: number) {
  if (percentage < 60) return "bg-green-500";
  if (percentage < 85) return "bg-orange-500";
  return "bg-red-500";
}

function formatBakeryType(
  type: string,
  t: (key: string) => string,
): string {
  const key = `orders.type.${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

function formatOrderStatus(
  status: string,
  t: (key: string) => string,
): string {
  const key = `statuses.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function formatProductName(
  productName: string,
  t: (key: string) => string,
): string {
  if (productName === "Custom Order") return t("orders.customOrder");
  const key = `orders.type.${productName}`;
  const translated = t(key);
  return translated === key ? productName : translated;
}

// Droppable Column Component
function BakeryColumn({
  bakeryId,
  bakeryName,
  location,
  capacity,
  orders,
  types,
  isCollapsed,
  onToggleCollapse,
  t,
  activeOrderType,
  isIncompatible,
  onPasteAssign,
}: {
  bakeryId: string;
  bakeryName: string;
  location: string;
  capacity: number;
  orders: Order[];
  types?: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  t: (key: string) => string;
  activeOrderType?: string;
  isIncompatible?: boolean;
  onPasteAssign: (bakeryId: string, value: string) => Promise<boolean>;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: bakeryId,
  });

  // Paste-to-assign: a "hidden" input revealed by the clipboard icon in the
  // header. Paste an order reference/id and submit to assign it to this bakery.
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const submitPaste = async () => {
    const value = pasteValue.trim();
    if (!value || isAssigning) return;
    setIsAssigning(true);
    const ok = await onPasteAssign(bakeryId, value);
    setIsAssigning(false);
    if (ok) {
      setPasteValue("");
      setIsPasteOpen(false);
    }
  };

  const orderIds = orders.map((order) => order.id);

  // Calculate used capacity
  const usedCapacity = orders.reduce(
    (sum, order) => sum + order.capacitySlots,
    0,
  );
  const capacityPercentage = (usedCapacity / capacity) * 100;

  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col h-[calc(100vh-16rem)] rounded-lg border bg-card shadow-sm transition-all w-16 overflow-hidden",
          isOver && !isIncompatible && "ring-2 ring-primary",
          isIncompatible && "opacity-50 cursor-not-allowed",
        )}
      >
        {/* Collapsed Header with rotated text */}
        <div className="flex-1 relative flex items-center justify-center p-2">
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            <span className="font-semibold text-sm whitespace-nowrap transform rotate-180">
              {bakeryName}
            </span>
          </div>
        </div>

        {/* Capacity Bar - Vertical */}
        <div className="px-2 pb-2">
          <div className="h-24 w-full bg-muted rounded-full overflow-hidden relative">
            <div
              className={cn(
                "absolute bottom-0 start-0 end-0 transition-all",
                getCapacityColor(capacityPercentage),
                isIncompatible && "opacity-50",
              )}
              style={{ height: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
          <div className="text-center text-xs font-medium mt-1">
            <div className="text-foreground">{usedCapacity}</div>
            <div className="text-muted-foreground text-[10px]">{capacity}</div>
          </div>
        </div>

        {/* Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full rounded-t-none"
          onClick={onToggleCollapse}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-[calc(100vh-16rem)] rounded-lg border bg-card shadow-sm transition-all overflow-hidden",
        isOver && !isIncompatible && "ring-2 ring-primary",
        isIncompatible && "opacity-50 cursor-not-allowed",
      )}
    >
      {/* Column Header */}
      <CardHeader className="shrink-0 border-b bg-muted/50 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{bakeryName}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {location}
            </p>
            {types && types.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {types.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      isIncompatible &&
                        activeOrderType !== type &&
                        "opacity-50",
                    )}
                  >
                    {formatBakeryType(type, t)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                isPasteOpen && "bg-primary/10 text-primary",
              )}
              onClick={() => setIsPasteOpen((open) => !open)}
              title={t("orders.pasteToAssign")}
              aria-label={t("orders.pasteToAssign")}
              aria-pressed={isPasteOpen}
            >
              <ClipboardPaste className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onToggleCollapse}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {t("orders.capacity")}
            </span>
            <span className="font-medium">
              {usedCapacity} / {capacity}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all rounded-full",
                getCapacityColor(capacityPercentage),
              )}
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              {Math.round(capacityPercentage)}% {t("orders.used")}
            </span>
            <span
              className={cn(
                "font-medium",
                capacityPercentage >= 85 && "text-red-500",
                capacityPercentage >= 60 &&
                  capacityPercentage < 85 &&
                  "text-orange-500",
                capacityPercentage < 60 && "text-green-500",
              )}
            >
              {capacity - usedCapacity} {t("orders.available")}
            </span>
          </div>
        </div>

        {/* Paste-to-assign input — revealed by the clipboard icon above. */}
        {isPasteOpen && (
          <div className="mt-3 flex items-center gap-1">
            <Input
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitPaste();
                } else if (e.key === "Escape") {
                  setIsPasteOpen(false);
                  setPasteValue("");
                }
              }}
              placeholder={t("orders.pasteReferenceHint")}
              disabled={isAssigning}
              autoFocus
              className="h-8 text-xs font-mono"
            />
            <Button
              size="sm"
              className="h-8 px-2 shrink-0"
              onClick={() => void submitPaste()}
              disabled={isAssigning || !pasteValue.trim()}
            >
              {isAssigning ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" />
              ) : (
                t("orders.assignByPaste")
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={() => {
                setIsPasteOpen(false);
                setPasteValue("");
              }}
              title={t("buttons.close")}
              aria-label={t("buttons.close")}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      {/* Orders List - With fixed height and internal scroll */}
      <ScrollArea className="flex-1 min-h-0 custom-scrollbar">
        <div className="p-3">
          <SortableContext
            items={orderIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t("orders.noOrders")}
                </div>
              ) : (
                orders.map((order) => (
                  <SortableOrderCard key={order.id} order={order} t={t} />
                ))
              )}
            </div>
          </SortableContext>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}

const Orders = () => {
  const { t } = useTranslation();
  const bakeries = useBakeryStore((state) => state.bakeries);
  const fetchBakeries = useBakeryStore((state) => state.fetchBakeries);

  // Kanban data comes from the backend `/orders/assigned` endpoint, grouped
  // by bakeryId. No client-side filtering / regrouping.
  const ordersByBakeryFromApi = useAssignedOrdersStore(
    (s) => s.ordersByBakery,
  );
  const reloadAssigned = useAssignedOrdersStore((s) => s.reload);
  const addAssignedOrder = useAssignedOrdersStore((s) => s.addOrder);
  const removeAssignedOrder = useAssignedOrdersStore((s) => s.removeOrder);
  const isLoading = useAssignedOrdersStore((s) => s.isLoading);

  // Unassigned sidebar store — page 1 also fetches on mount.
  const reloadUnassigned = useUnassignedOrdersStore((s) => s.reload);
  const addUnassignedOrder = useUnassignedOrdersStore((s) => s.addOrder);
  const removeUnassignedOrder = useUnassignedOrdersStore((s) => s.removeOrder);
  // The region filter is owned by the sidebar and written into the unassigned
  // store's filters. We read it here so it also scopes the bakery columns to
  // bakeries in the selected region. Undefined = "all regions".
  const selectedRegionId = useUnassignedOrdersStore((s) => s.filters.regionId);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set(),
  );
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Fetch bakeries + both order feeds once on mount.
  useEffect(() => {
    if (hasInitialized) return;

    const initializeData = async () => {
      try {
        await fetchBakeries();
      } catch (error) {
        console.error("Failed to fetch bakeries:", error);
      }
      await Promise.all([
        reloadAssigned().catch((err) =>
          console.error("Failed to fetch assigned orders:", err),
        ),
        reloadUnassigned().catch((err) =>
          console.error("Failed to fetch unassigned orders:", err),
        ),
      ]);
      setHasInitialized(true);
    };

    initializeData();
  }, [hasInitialized, fetchBakeries, reloadAssigned, reloadUnassigned]);

  // Local drag-and-drop ordering hint. Keyed by orderId, only meaningful
  // while a drag is in flight — the canonical order list comes from the API.
  const [orderPositions, setOrderPositions] = useState<Record<string, number>>(
    {},
  );

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
  );

  // Orders for each bakery come pre-grouped from the API. We just apply the
  // local drag-and-drop ordering hint on top.
  const bakeryOrders = useMemo(() => {
    const out: Record<string, Order[]> = {};
    bakeries.forEach((bakery) => {
      const list = ordersByBakeryFromApi[bakery.id] || [];
      out[bakery.id] = [...list].sort(
        (a, b) => (orderPositions[a.id] || 0) - (orderPositions[b.id] || 0),
      );
    });
    return out;
  }, [bakeries, ordersByBakeryFromApi, orderPositions]);

  // Columns shown on the board. When a region is selected in the sidebar
  // filter, only bakeries in that region are rendered. `bakeries` itself stays
  // the full list so drag/assign lookups and validation are unaffected.
  const visibleBakeries = useMemo(
    () =>
      selectedRegionId
        ? bakeries.filter((b) => b.regionId === selectedRegionId)
        : bakeries,
    [bakeries, selectedRegionId],
  );

  // Flat list of every order currently visible on the page (assigned + unassigned).
  // Used by the drag handlers to look up the order being dragged.
  const unassignedOrders = useUnassignedOrdersStore((s) => s.orders);
  const orders = useMemo<Order[]>(() => {
    const assigned = Object.values(ordersByBakeryFromApi).flat();
    return [...assigned, ...unassignedOrders];
  }, [ordersByBakeryFromApi, unassignedOrders]);

  const toggleColumnCollapse = (bakeryId: string) => {
    setCollapsedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bakeryId)) {
        newSet.delete(bakeryId);
      } else {
        newSet.add(bakeryId);
      }
      return newSet;
    });
  };

  // API call to assign / reassign an order to a bakery. The board itself is
  // updated optimistically in the drag handler — this only talks to the server
  // and reports success so the handler can keep or revert the in-memory move.
  const assignOrderToBakery = async (orderId: string, bakeryId: string) => {
    try {
      const response = await httpRequest(
        `${env.API_BASE_URL}/orders/${orderId}/assign-bakery`,
        {
          method: "PATCH",
          body: { bakeryId },
        },
      );

      if (!response.ok) {
        // Try to surface API error message to the UI
        let errorMsg = "Failed to assign order";
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData.message === "string") {
            errorMsg = errorData.message;
          }
        } catch {
          // ignore JSON parse errors
        }
        console.error("Failed to assign order:", errorMsg);
        setAssignError(errorMsg);
        return false;
      }

      // Clear any previous assign error on success.
      setAssignError(null);
      return true;
    } catch (error) {
      console.error("Error assigning order:", error);
      const message =
        error instanceof Error ? error.message : "Failed to assign order";
      setAssignError(message);
      return false;
    }
  };

  // API call to return an order to the unassigned pool (admin unassign). Board
  // state is updated optimistically in the drag handler, same as assignment.
  const returnOrderToPool = async (orderId: string) => {
    try {
      const response = await orderApi.unassignFromBakery(orderId);
      if (!response.success) {
        const message = response.message || "Failed to return order";
        console.error("Failed to return order:", message);
        setAssignError(message);
        return false;
      }
      setAssignError(null);
      return true;
    } catch (error) {
      console.error("Error returning order:", error);
      const message =
        error instanceof Error ? error.message : "Failed to return order";
      setAssignError(message);
      return false;
    }
  };

  // Validation function to check if an order can be assigned to a bakery
  const canAssignOrderToBakery = (
    order: Order,
    bakery: Bakery & { regions?: string[] },
  ): { valid: boolean; reason?: string } => {
    // 1. Check if bakery supports the order's type (STRICT TYPE MATCHING)
    if (order.type && bakery.types) {
      const hasRequiredType = bakery.types.includes(order.type);

      if (!hasRequiredType) {
        return {
          valid: false,
          reason: `Bakery only handles ${bakery.types.join(", ")} orders, not ${order.type}`,
        };
      }
    }

    // 2. Check if bakery is in the same region
    const orderRegion = (order as Record<string, unknown>).region as
      | string
      | undefined;
    if (orderRegion && bakery.regions) {
      const isInRegion = bakery.regions.includes(orderRegion);
      if (!isInRegion) {
        return {
          valid: false,
          reason: `Bakery is not in the ${orderRegion} region`,
        };
      }
    }

    // 3. Check available capacity
    const orderCapacity = order.capacitySlots || 0;
    const currentBakeryOrders = orders.filter(
      (o) => o.assignedBakeryId === bakery.id,
    );
    const usedCapacity = currentBakeryOrders.reduce((sum, o) => {
      const capacity = o.capacitySlots || 0;
      return sum + capacity;
    }, 0);

    const availableCapacity = bakery.capacity - usedCapacity;

    if (orderCapacity > availableCapacity) {
      return {
        valid: false,
        reason: `Not enough capacity: need ${orderCapacity}, available ${availableCapacity}`,
      };
    }

    return { valid: true };
  };

  // Shared assign path used by both drag-and-drop and paste-to-assign:
  // validate, move the card optimistically, hit the API, and revert on failure.
  // Returns whether the server accepted the assignment.
  const performAssign = async (
    order: Order,
    targetBakeryId: string,
  ): Promise<boolean> => {
    const bakery = bakeries.find((b) => b.id === targetBakeryId);
    if (!bakery) return false;

    const validation = canAssignOrderToBakery(order, bakery);
    if (!validation.valid) {
      console.error("Cannot assign order:", validation.reason);
      setAssignError(validation.reason ?? "Cannot assign order to this bakery");
      return false;
    }
    setAssignError(null);

    const sourceBakeryId = order.assignedBakeryId ?? null;
    const targetIndex = (bakeryOrders[targetBakeryId] || []).length;
    const movedOrder: Order = {
      ...order,
      assignedBakeryId: targetBakeryId,
      assignedBakeryName: bakery.name || "",
      assignedAt: new Date().toISOString(),
    };

    // --- Optimistic in-memory move (no refetch) ---
    if (sourceBakeryId) {
      removeAssignedOrder(order.id);
    } else {
      removeUnassignedOrder(order.id);
    }
    addAssignedOrder(targetBakeryId, movedOrder);
    setOrderPositions((prev) => ({ ...prev, [order.id]: targetIndex }));

    const ok = await assignOrderToBakery(order.id, targetBakeryId);
    if (!ok) {
      // Revert: pull it back out of the target and restore the source.
      removeAssignedOrder(order.id);
      if (sourceBakeryId) {
        addAssignedOrder(sourceBakeryId, order);
      } else {
        addUnassignedOrder(order);
      }
    }
    return ok;
  };

  // Resolve a pasted reference / order id to an Order, then assign it to the
  // given bakery. Looks in the orders already on the board first, then falls
  // back to the backend (reference search, then id lookup) so an order that
  // isn't on a loaded page can still be assigned.
  const handlePasteAssign = async (
    bakeryId: string,
    rawValue: string,
  ): Promise<boolean> => {
    const value = rawValue.trim();
    if (!value) return false;
    const needle = value.toLowerCase();

    const matches = (o: Order) =>
      o.id === value || (o.referenceNumber?.toLowerCase() ?? "") === needle;

    // 1. In-memory (covers all assigned orders + the loaded unassigned pool).
    let order = orders.find(matches);

    // 2. Backend reference search on the unassigned feed.
    if (!order) {
      try {
        const res = await orderApi.getUnassigned({ q: value, limit: 10 });
        if (res.success && res.data) {
          const items = res.data.items;
          const hit =
            items.find(
              (it) =>
                it.id === value ||
                (it.referenceNumber?.toLowerCase() ?? "") === needle,
            ) ?? (items.length === 1 ? items[0] : undefined);
          if (hit) order = convertApiResponseToOrder(hit);
        }
      } catch (err) {
        console.error("Paste assign: reference lookup failed", err);
      }
    }

    // 3. Treat the pasted value as an order id.
    if (!order) {
      try {
        const res = await orderApi.getOne(value);
        if (res.success && res.data) order = convertApiResponseToOrder(res.data);
      } catch {
        // getOne 404s when the value isn't an id — fall through to not-found.
      }
    }

    if (!order) {
      setAssignError(t("orders.orderNotFound", { value }));
      return false;
    }

    if (order.assignedBakeryId === bakeryId) {
      setAssignError(t("orders.alreadyAssignedHere"));
      return false;
    }

    return performAssign(order, bakeryId);
  };

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    const order = orders.find((o) => o.id === active.id);
    if (order) {
      setActiveOrder(order);
    }

    // Close sidebar on small screens when starting to drag
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active and over orders
    const activeOrder = orders.find((o) => o.id === activeId);
    if (!activeOrder) return;

    // Check if we're over a bakery column or another order
    const overBakery = bakeries.find((b) => b.id === overId);
    const overOrder = orders.find((o) => o.id === overId);

    if (overBakery) {
      // Validate if order can be assigned to this bakery
      const validation = canAssignOrderToBakery(activeOrder, overBakery);
      if (!validation.valid) {
        console.warn(validation.reason);
        return; // Don't allow assignment - bakery incompatible
      }
      // Just update UI preview - API call happens on drop
    } else if (overOrder && overOrder.assignedBakeryId) {
      // Dragging over another order
      if (activeOrder.assignedBakeryId !== overOrder.assignedBakeryId) {
        const targetBakery = bakeries.find(
          (b) => b.id === overOrder.assignedBakeryId,
        );
        if (targetBakery) {
          const validation = canAssignOrderToBakery(activeOrder, targetBakery);
          if (!validation.valid) {
            console.warn(validation.reason);
            return; // Don't allow assignment
          }
        }
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeOrder = orders.find((o) => o.id === activeId);
    if (!activeOrder) return;

    // Work out the drop intent: a bakery column (or a card inside one) means
    // assign/reassign; the sidebar (or a card inside it) means return to pool.
    const overBakery = bakeries.find((b) => b.id === overId);
    const overOrder = orders.find((o) => o.id === overId);

    let targetBakeryId: string | null = null;
    let returnToPool = false;
    if (overBakery) {
      targetBakeryId = overBakery.id;
    } else if (overOrder?.assignedBakeryId) {
      targetBakeryId = overOrder.assignedBakeryId;
    } else if (
      overId === "unassigned-sidebar" ||
      (overOrder && !overOrder.assignedBakeryId)
    ) {
      returnToPool = true;
    }

    // Reorder within the same bakery column — local only, no API call.
    if (targetBakeryId && activeOrder.assignedBakeryId === targetBakeryId) {
      if (overOrder && overOrder.id !== activeId) {
        const list = bakeryOrders[targetBakeryId] || [];
        const oldIndex = list.findIndex((o) => o.id === activeId);
        const newIndex = list.findIndex((o) => o.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(list, oldIndex, newIndex);
          const newPositions = { ...orderPositions };
          reordered.forEach((o, index) => {
            newPositions[o.id] = index;
          });
          setOrderPositions(newPositions);
        }
      }
      return;
    }

    // Assign a pool order, or reassign an order from another bakery.
    if (targetBakeryId) {
      await performAssign(activeOrder, targetBakeryId);
      return;
    }

    // Return an assigned order to the unassigned pool (admin unassign).
    if (returnToPool) {
      if (!activeOrder.assignedBakeryId) return; // already unassigned
      setAssignError(null);

      const sourceBakeryId = activeOrder.assignedBakeryId;
      const pooledOrder: Order = {
        ...activeOrder,
        assignedBakeryId: undefined,
        assignedBakeryName: undefined,
        assignedAt: undefined,
      };

      // --- Optimistic in-memory move (no refetch) ---
      removeAssignedOrder(activeId);
      addUnassignedOrder(pooledOrder);

      const ok = await returnOrderToPool(activeId);
      if (!ok) {
        // Revert: pull it back out of the pool and restore the bakery column.
        removeUnassignedOrder(activeId);
        addAssignedOrder(sourceBakeryId, activeOrder);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveOrder(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex w-full h-full">
        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 min-w-0 p-6 overflow-hidden flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {t("orders.title")}
            </h1>
            <p className="text-muted-foreground">{t("orders.description")}</p>
            {assignError && (
              <div className="rounded-md bg-red-50 p-3 mt-4 text-sm text-red-800 flex items-start justify-between">
                <div className="me-4">{assignError}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAssignError(null)}
                >
                  {t("common.dismiss")}
                </Button>
              </div>
            )}
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center justify-center flex-1">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-e-transparent" />
                <p className="text-sm text-muted-foreground">
                  {t("orders.loadingOrders")}
                </p>
              </div>
            </div>
          )}

          {!isLoading && visibleBakeries.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {t("orders.noBakeriesInRegion")}
              </p>
            </div>
          )}

          {!isLoading && visibleBakeries.length > 0 && (
            <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
              <div className="flex gap-4 h-full pb-4 min-h-fit">
                {visibleBakeries.map((bakery) => {
                  // Check if bakery is compatible with active order
                  const isIncompatible =
                    activeOrder && !bakery.types.includes(activeOrder.type);

                  return (
                    <div
                      key={bakery.id}
                      className={cn(
                        "transition-all shrink-0",
                        collapsedColumns.has(bakery.id) ? "w-16" : "w-75",
                      )}
                    >
                      <BakeryColumn
                        bakeryId={bakery.id}
                        bakeryName={bakery.name}
                        location={bakery.locationDescription}
                        capacity={bakery.capacity}
                        orders={bakeryOrders[bakery.id] || []}
                        types={bakery.types}
                        isCollapsed={collapsedColumns.has(bakery.id)}
                        onToggleCollapse={() => toggleColumnCollapse(bakery.id)}
                        t={t}
                        activeOrderType={activeOrder?.type}
                        isIncompatible={isIncompatible || false}
                        onPasteAssign={handlePasteAssign}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Scrollable, fixed width, absolutely positioned */}
        {/* Mobile Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "lg:hidden fixed bottom-6 end-6 rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 z-50 transition-opacity",
            isSidebarOpen && "opacity-0 pointer-events-none",
          )}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={t("orders.openSidebar")}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Sidebar Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Right Sidebar - Responsive */}
        <div
          className={cn(
            "w-88 border-s bg-sidebar overflow-hidden transition-transform duration-300 ease-in-out",
            // Desktop: always visible
            "hidden lg:flex lg:flex-col lg:relative",
            // Mobile: slides in/out from right
            isSidebarOpen &&
              "flex! fixed! end-0 top-16 h-[calc(100vh-4rem)] z-40 w-full max-w-xs flex-col",
          )}
        >
          <OrdersSidebarRight onClose={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeOrder ? (
          <Card className="w-80 shadow-lg cursor-grabbing opacity-95 ring-2 ring-primary">
            <CardHeader className="py-2 px-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary w-fit">
                  {activeOrder.referenceNumber || `#${activeOrder.id}`}
                </span>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {formatProductName(activeOrder.productName, t)}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="truncate">
                        {activeOrder.customerName}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {formatBakeryType(activeOrder.type, t)}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    <span>
                      {(() => {
                        const dateStr =
                          activeOrder.orderedAt || activeOrder.deliverDay;
                        try {
                          return format(new Date(dateStr), "MMM d");
                        } catch {
                          return "-";
                        }
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>
                      {activeOrder.capacitySlots} {t("orders.slots")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {activeOrder.region}
                  </span>
                  <span className="text-sm font-semibold">
                    {activeOrder.totalPrice} {t("common.currency")}
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Orders;
