import { format } from "date-fns";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrderStore } from "@/stores/orderStore";
import { useRegionStore } from "@/stores/regionStore";
import { type Order } from "@/data/orders";
import {
  CalendarIcon,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";

import { Select } from "@/components/ui/select";
import {
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type DraggableOrderCardProps = {
  order: Order;
  onNavigate: (id: string) => void;
};

function DraggableOrderCard({ order, onNavigate }: DraggableOrderCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: order.id,
      data: {
        type: "order",
        order,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Color coding for capacity slots
  let slotBg = "bg-[color:oklch(87.79%_0.23094_129.081_/_0.35)]";
  if (order.capacitySlots === 2)
    slotBg = "bg-[color:oklch(86.176%_0.17204_88.899_/_0.35)]";
  if (order.capacitySlots >= 3)
    slotBg = "bg-[color:oklch(0.577_0.245_27.325_/_0.35)]";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`transition-all hover:shadow-md border border-border/60 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
      onDoubleClick={() => !isDragging && onNavigate(order.id)}
    >
      <CardHeader className="py-2 px-3 flex flex-row items-center gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base font-semibold truncate">
            {order.productName}
          </CardTitle>
          <p className="text-xs text-muted-foreground truncate mb-1">
            {order.customerName}
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground/80 capitalize">
              {order.type}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {format(new Date(order.deliverDay), "MMM d, yyyy")}
            </span>
            <span
              className="ml-1 px-1.5 py-0.5 rounded bg-accent text-foreground/80 truncate max-w-24"
              title={order.region}
            >
              {order.region}
            </span>
          </div>
        </div>
        <div className="ml-2 flex items-center">
          <span
            className={`inline-flex items-center justify-center min-w-8 px-3 py-1 rounded-lg font-bold text-xs shadow-sm ${slotBg} text-black dark:text-white`}
            title="Capacity Slots"
          >
            {order.capacitySlots}
          </span>
        </div>
      </CardHeader>
    </Card>
  );
}

export function OrdersSidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const orders = useOrderStore((state) => state.orders);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc" | null>(null);
  const [regionFilter, setRegionFilter] = React.useState<string>("all");

  // Get regions from the region store
  const regions = useRegionStore((state) => state.regions);

  // Filter by region and unassigned orders only
  const filteredOrders = React.useMemo(() => {
    const unassignedOrders = orders.filter(
      (order) => !(order as any).assignedBakeryId
    );
    if (regionFilter === "all") return unassignedOrders;
    return unassignedOrders.filter((order) => order.region === regionFilter);
  }, [orders, regionFilter]);

  // Sort orders by deliverDay or show original
  const sortedOrders = React.useMemo(() => {
    if (!sortDir) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      const aTime = new Date(a.deliverDay).getTime();
      const bTime = new Date(b.deliverDay).getTime();
      return sortDir === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [filteredOrders, sortDir]);

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <Sidebar
      collapsible="none"
      className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[22rem] border-l hidden lg:flex flex-col bg-sidebar z-30"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <div>
          <span className="font-semibold text-lg">Unassigned Orders</span>
          <p className="text-xs text-muted-foreground mt-1">
            Drag to assign to bakery
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Filter by Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.name}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition px-2 py-1 rounded focus:outline-none"
            onClick={() =>
              setSortDir((d) =>
                d === null ? "asc" : d === "asc" ? "desc" : null
              )
            }
            title={
              sortDir === "asc"
                ? "Sort by delivery date (Ascending)"
                : sortDir === "desc"
                ? "Sort by delivery date (Descending)"
                : "Remove sorting"
            }
          >
            <span>Sort by Time</span>
            {sortDir === "asc" ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : sortDir === "desc" ? (
              <ChevronDown className="w-4 h-4 ml-1" />
            ) : (
              <ChevronsUpDown className="w-4 h-4 ml-1 text-muted-foreground opacity-50" />
            )}
          </button>
        </div>
        <ScrollArea className="h-[80%] overflow-y-auto custom-scrollbar flex flex-col gap-2">
          <div
            key={sortDir + regionFilter}
            className="flex flex-col gap-2 transition-opacity duration-200 animate-fadein"
          >
            {sortedOrders.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                All orders have been assigned
              </div>
            ) : (
              sortedOrders.map((order: Order) => (
                <DraggableOrderCard
                  key={order.id}
                  order={order}
                  onNavigate={handleOrderClick}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <SidebarSeparator className="mx-0 w-full mt-2" />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate("/orders")}>
              <span>View All Orders</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
