import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { useOrderStore } from "@/stores/orderStore";
import type { Order } from "@/data/orders";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Package,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Sortable Order Card within column
function SortableOrderCard({ order }: { order: Order }) {
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
          "bg-background hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50"
        )}
        onClick={handleClick}
        {...listeners}
      >
        <CardHeader className="py-0 px-3">
          <div className="space-y-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order.id}`);
              }}
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors w-fit cursor-pointer"
              title={`Click to view order ${order.id}`}
            >
              #{order.id}
            </button>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">
                  {order.productName}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span className="truncate">{order.customerName}</span>
                </div>
              </div>
              <Badge variant="outline" className="capitalize text-xs shrink-0">
                {order.type}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>{format(new Date(order.deliverDay), "MMM d")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                <span>{order.capacitySlots} slots</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                {order.region}
              </span>
              <span className="text-sm font-semibold">
                {order.totalPrice} EGP
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

// Format bakery type for display
function formatBakeryType(type: string): string {
  const typeMap: Record<string, string> = {
    basket_cakes: "Basket Cakes",
    midume: "Midume",
    small_cakes: "Small Cakes",
    large_cakes: "Large Cakes",
    custom: "Custom",
  };
  return typeMap[type] || type;
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
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: bakeryId,
  });

  const orderIds = orders.map((order) => order.id);

  // Calculate used capacity
  const usedCapacity = orders.reduce(
    (sum, order) => sum + order.capacitySlots,
    0
  );
  const capacityPercentage = (usedCapacity / capacity) * 100;

  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col h-[calc(100vh-16rem)] rounded-lg border bg-card shadow-sm transition-all w-16 overflow-hidden",
          isOver && !isIncompatible && "ring-2 ring-primary",
          isIncompatible && "opacity-50 cursor-not-allowed"
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
                "absolute bottom-0 left-0 right-0 transition-all",
                getCapacityColor(capacityPercentage),
                isIncompatible && "opacity-50"
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
        isIncompatible && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Column Header */}
      <CardHeader className="shrink-0 border-b bg-muted/50 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{bakeryName}</h3>
            <p className="text-xs text-muted-foreground truncate">{location}</p>
            {types && types.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {types.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      isIncompatible && activeOrderType !== type && "opacity-50"
                    )}
                  >
                    {formatBakeryType(type)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
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
                getCapacityColor(capacityPercentage)
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
                capacityPercentage < 60 && "text-green-500"
              )}
            >
              {capacity - usedCapacity} {t("orders.available")}
            </span>
          </div>
        </div>
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
                  <SortableOrderCard key={order.id} order={order} />
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
  const orders = useOrderStore((state) => state.orders);
  const updateOrder = useOrderStore((state) => state.updateOrder);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(
    new Set()
  );

  // Local state for managing order positions
  const [orderPositions, setOrderPositions] = useState<Record<string, number>>(
    () => {
      const positions: Record<string, number> = {};
      orders.forEach((order, index) => {
        if (order.assignedBakeryId) {
          positions[order.id] = index;
        }
      });
      return positions;
    }
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
    })
  );

  // Get orders for each bakery, sorted by position
  const bakeryOrders = useMemo(() => {
    const ordersByBakery: Record<string, Order[]> = {};
    bakeries.forEach((bakery) => {
      const bakeryOrderList = orders
        .filter((order) => order.assignedBakeryId === bakery.id)
        .sort(
          (a, b) => (orderPositions[a.id] || 0) - (orderPositions[b.id] || 0)
        );
      ordersByBakery[bakery.id] = bakeryOrderList;
    });
    return ordersByBakery;
  }, [bakeries, orders, orderPositions]);

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

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    const order = orders.find((o) => o.id === active.id);
    if (order) {
      setActiveOrder(order);
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
      // Check if bakery supports this order type
      if (!overBakery.types.includes(activeOrder.type)) {
        return; // Don't allow drop on incompatible bakery
      }

      // Dragging over a bakery column
      if (activeOrder.assignedBakeryId !== overBakery.id) {
        updateOrder(activeId, {
          assignedBakeryId: overBakery.id,
          assignedBakeryName: overBakery.name,
          assignedAt: new Date().toISOString(),
        });
      }
    } else if (overOrder && overOrder.assignedBakeryId) {
      // Dragging over another order - move to that bakery
      if (activeOrder.assignedBakeryId !== overOrder.assignedBakeryId) {
        updateOrder(activeId, {
          assignedBakeryId: overOrder.assignedBakeryId,
          assignedBakeryName: overOrder.assignedBakeryName,
          assignedAt: new Date().toISOString(),
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find orders
    const activeOrder = orders.find((o) => o.id === activeId);
    const overOrder = orders.find((o) => o.id === overId);

    if (!activeOrder) return;

    // Check if we're dropping on a bakery column
    const overBakery = bakeries.find((b) => b.id === overId);

    if (overBakery) {
      // Check if bakery supports this order type
      if (!overBakery.types.includes(activeOrder.type)) {
        return; // Don't allow drop on incompatible bakery
      }

      // Dropping on a bakery column
      updateOrder(activeId, {
        assignedBakeryId: overBakery.id,
        assignedBakeryName: overBakery.name,
        assignedAt: new Date().toISOString(),
      });
    } else if (overOrder && overOrder.assignedBakeryId) {
      // Dropping on another order - reorder within the same bakery
      const bakeryId = overOrder.assignedBakeryId;
      const bakeryOrderList = bakeryOrders[bakeryId] || [];
      const oldIndex = bakeryOrderList.findIndex((o) => o.id === activeId);
      const newIndex = bakeryOrderList.findIndex((o) => o.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(bakeryOrderList, oldIndex, newIndex);

        // Update positions for all orders in this bakery
        const newPositions = { ...orderPositions };
        reordered.forEach((order, index) => {
          newPositions[order.id] = index;
        });
        setOrderPositions(newPositions);
      }

      // Make sure the active order is assigned to this bakery
      if (activeOrder.assignedBakeryId !== bakeryId) {
        const bakery = bakeries.find((b) => b.id === bakeryId);
        if (bakery) {
          updateOrder(activeId, {
            assignedBakeryId: bakery.id,
            assignedBakeryName: bakery.name,
            assignedAt: new Date().toISOString(),
          });
        }
      }
    } else if (overId === "unassigned-sidebar") {
      // Dropping on the unassigned sidebar - remove bakery assignment
      updateOrder(activeId, {
        assignedBakeryId: undefined,
        assignedBakeryName: undefined,
        assignedAt: undefined,
      });
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
          </div>

          {/* Kanban Board - Only horizontal scroll here */}
          <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex gap-4 h-full pb-4 min-h-fit">
              {bakeries.map((bakery) => {
                // Check if bakery is compatible with active order
                const isIncompatible =
                  activeOrder && !bakery.types.includes(activeOrder.type);

                return (
                  <div
                    key={bakery.id}
                    className={cn(
                      "transition-all shrink-0",
                      collapsedColumns.has(bakery.id) ? "w-16" : "w-75"
                    )}
                  >
                    <BakeryColumn
                      bakeryId={bakery.id}
                      bakeryName={bakery.name}
                      location={bakery.location}
                      capacity={bakery.capacity}
                      orders={bakeryOrders[bakery.id] || []}
                      types={bakery.types}
                      isCollapsed={collapsedColumns.has(bakery.id)}
                      onToggleCollapse={() => toggleColumnCollapse(bakery.id)}
                      t={t}
                      activeOrderType={activeOrder?.type}
                      isIncompatible={isIncompatible || false}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Scrollable, fixed width, absolutely positioned */}
        <div className="w-88 shrink-0 flex flex-col border-l overflow-hidden">
          <OrdersSidebarRight />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeOrder ? (
          <Card className="w-80 shadow-lg cursor-grabbing opacity-95 ring-2 ring-primary">
            <CardHeader className="py-2 px-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary w-fit">
                  #{activeOrder.id}
                </span>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {activeOrder.productName}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="truncate">
                        {activeOrder.customerName}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="capitalize text-xs shrink-0"
                  >
                    {activeOrder.type}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    <span>
                      {format(new Date(activeOrder.deliverDay), "MMM d")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>{activeOrder.capacitySlots} slots</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {activeOrder.region}
                  </span>
                  <span className="text-sm font-semibold">
                    {activeOrder.totalPrice} EGP
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
