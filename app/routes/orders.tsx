import { useState, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn(
          "bg-background hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50"
        )}
      >
        <CardHeader className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">
                  {order.productName}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
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

// Droppable Column Component
function BakeryColumn({
  bakeryId,
  bakeryName,
  location,
  capacity,
  orders,
  isCollapsed,
  onToggleCollapse,
}: {
  bakeryId: string;
  bakeryName: string;
  location: string;
  capacity: number;
  orders: Order[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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
          "flex flex-col h-full min-h-0 rounded-lg border bg-card shadow-sm transition-all w-16",
          isOver && "ring-2 ring-primary"
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
                getCapacityColor(capacityPercentage)
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
        "flex flex-col h-full min-h-0 rounded-lg border bg-card shadow-sm transition-all",
        isOver && "ring-2 ring-primary"
      )}
    >
      {/* Column Header */}
      <CardHeader className="flex-shrink-0 border-b bg-muted/50 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{bakeryName}</h3>
            <p className="text-xs text-muted-foreground truncate">{location}</p>
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
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-medium">
              {usedCapacity} / {capacity}
            </span>
          </div>
          <div className="relative">
            <Progress value={capacityPercentage} className="h-2" />
            <div
              className={cn(
                "absolute inset-0 rounded-full transition-all",
                getCapacityColor(capacityPercentage)
              )}
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{Math.round(capacityPercentage)}% used</span>
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
              {capacity - usedCapacity} available
            </span>
          </div>
        </div>
      </CardHeader>

      {/* Orders List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3">
          <SortableContext
            items={orderIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No orders assigned
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

  const handleDragStart = (event: any) => {
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
      // Dragging over a bakery column
      if (activeOrder.assignedBakeryId !== overBakery.id) {
        updateOrder(activeId, {
          assignedBakeryId: overBakery.id,
          assignedBakeryName: overBakery.name,
        });
      }
    } else if (overOrder && overOrder.assignedBakeryId) {
      // Dragging over another order - move to that bakery
      if (activeOrder.assignedBakeryId !== overOrder.assignedBakeryId) {
        updateOrder(activeId, {
          assignedBakeryId: overOrder.assignedBakeryId,
          assignedBakeryName: overOrder.assignedBakeryName,
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
      // Dropping on a bakery column
      updateOrder(activeId, {
        assignedBakeryId: overBakery.id,
        assignedBakeryName: overBakery.name,
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
          });
        }
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
        {/* Main Content Area - with right padding for sidebar */}
        <div className="flex-1 p-6 overflow-hidden pr-[calc(22rem+1.5rem)] lg:pr-[calc(22rem+1.5rem)]">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Orders Management
            </h1>
            <p className="text-muted-foreground">
              Drag orders from the sidebar to assign them to bakeries
            </p>
          </div>

          {/* Kanban Board */}
          <div className="h-[calc(100vh-12rem)] overflow-x-auto">
            <div className="flex gap-4 h-full pb-4">
              {bakeries.map((bakery) => (
                <div
                  key={bakery.id}
                  className={cn(
                    "transition-all",
                    collapsedColumns.has(bakery.id)
                      ? "w-16"
                      : "min-w-[300px] flex-1"
                  )}
                >
                  <BakeryColumn
                    bakeryId={bakery.id}
                    bakeryName={bakery.name}
                    location={bakery.location}
                    capacity={bakery.capacity}
                    orders={bakeryOrders[bakery.id] || []}
                    isCollapsed={collapsedColumns.has(bakery.id)}
                    onToggleCollapse={() => toggleColumnCollapse(bakery.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <OrdersSidebarRight />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeOrder ? (
          <Card className="w-80 shadow-lg cursor-grabbing opacity-95 ring-2 ring-primary">
            <CardHeader className="p-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {activeOrder.productName}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
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
