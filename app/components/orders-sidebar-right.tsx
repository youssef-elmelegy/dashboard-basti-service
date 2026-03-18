import { format, isSameDay } from "date-fns";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
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
  X,
  Search,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select } from "@/components/ui/select";
import {
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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

  const orderTypeColors: Record<string, string> = {
    big_cakes: "bg-rose-500/10",
    small_cakes: "bg-amber-500/10",
    others: "bg-teal-500/10",
  };
  const typeColor = orderTypeColors[order.type] || "bg-teal-500/10";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`transition-all hover:shadow-md border cursor-grab active:cursor-grabbing ${
        typeColor
      } ${isDragging ? "opacity-50" : ""}`}
      onDoubleClick={() => !isDragging && onNavigate(order.id)}
    >
      <CardHeader className="py-0 px-3 flex flex-col gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(order.id);
          }}
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors w-fit cursor-pointer"
          title={`Click to view order ${order.referenceNumber || order.id}`}
        >
          {order.referenceNumber || `#${order.id}`}
        </button>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-semibold truncate">
            {order.productName}
          </CardTitle>
          <p className="text-xs text-muted-foreground truncate mb-0.5">
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
        <div className="flex items-center justify-between gap-2">
          <div /> {/* Spacer */}
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
  onClose,
  ...props
}: React.ComponentProps<typeof Sidebar> & { onClose?: () => void }) {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const orders = useOrderStore((state) => state.orders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc" | null>(null);
  const [regionFilter, setRegionFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<Date | undefined>(
    undefined,
  );
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Get regions from the region store
  const regions = useRegionStore((state) => state.regions);

  // Filter by region and unassigned orders only
  const filteredOrders = React.useMemo(() => {
    const unassignedOrders = orders.filter(
      (order): order is Order => !order.assignedBakeryId,
    );
    let filtered = unassignedOrders;

    // Apply region filter
    if (regionFilter !== "all") {
      filtered = filtered.filter((order) => order.region === regionFilter);
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter((order) =>
        isSameDay(new Date(order.deliverDay), dateFilter),
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((order) =>
        (order.referenceNumber || order.id).toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [orders, regionFilter, dateFilter, searchTerm]);

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
    onClose?.();
  };

  // Get all unassigned order dates for calendar highlighting
  const unassignedOrders = React.useMemo(() => {
    return orders.filter((order): order is Order => !order.assignedBakeryId);
  }, [orders]);

  const orderDates = React.useMemo(() => {
    return unassignedOrders.map((order) => new Date(order.deliverDay));
  }, [unassignedOrders]);

  return (
    <Sidebar
      collapsible="none"
      className="flex flex-col h-full w-full bg-sidebar"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-semibold text-lg">
              {t("orders.unassignedOrders")}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {t("orders.dragToAssign")}
            </p>
          </div>
          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="lg:hidden flex-shrink-0 p-2 -mr-2 hover:bg-accent rounded-md transition-colors"
              title={t("common.close")}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder={t("orders.filterByRegion")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("orders.allRegions")}</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.name}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search by Reference Number */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 flex items-center justify-center"
                title={t("orders.searchByReference") || "Search by reference"}
              >
                <Search className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-3"
              align={isRTL ? "end" : "start"}
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("orders.searchByReference") ||
                    "Search by reference number"}
                </label>
                <Input
                  placeholder={
                    t("orders.enterReference") || "Enter reference number"
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    {t("common.clear")}
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1" />
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition px-2 py-1 rounded focus:outline-none"
            onClick={() =>
              setSortDir((d) =>
                d === null ? "asc" : d === "asc" ? "desc" : null,
              )
            }
            title={
              sortDir === "asc"
                ? `${t("orders.sortByTime")} (${t("common.loading")})`
                : sortDir === "desc"
                  ? `${t("orders.sortByTime")} (${t("common.loading")})`
                  : `${t("common.loading")} ${t("orders.sortByTime")}`
            }
          >
            <span>{t("orders.sortByTime")}</span>
            {sortDir === "asc" ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : sortDir === "desc" ? (
              <ChevronDown className="w-4 h-4 ml-1" />
            ) : (
              <ChevronsUpDown className="w-4 h-4 ml-1 text-muted-foreground opacity-50" />
            )}
          </button>
        </div>
        <ScrollArea className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 mb-2">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1 py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                <p className="text-xs text-muted-foreground">
                  {t("common.loading") || "Loading..."}
                </p>
              </div>
            </div>
          ) : (
            <div
              key={sortDir + regionFilter}
              className="flex flex-col gap-2 transition-opacity duration-200 animate-fadein"
            >
              {sortedOrders.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t("orders.noOrders")}
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
          )}
        </ScrollArea>

        <SidebarSeparator className="mx-0 w-full mb-2" />

        {/* Calendar Button - Popup on demand */}
        <div className="flex gap-2 items-center w-full -mx-4 px-4">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 flex items-center gap-2 text-xs h-8"
              >
                <CalendarIcon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {t("orders.filterByDate")}
                </span>
                {dateFilter && (
                  <span className="ml-auto text-xs text-red-600 font-medium shrink-0">
                    {format(dateFilter, "MMM d")}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align={isRTL ? "end" : "start"}
            >
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {t("orders.filterByDate")}
                  </span>
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter(undefined)}
                      className="text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      {t("common.clear")}
                    </button>
                  )}
                </div>
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={(date) => {
                    setDateFilter(date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) =>
                    !orderDates.some((orderDate) => isSameDay(orderDate, date))
                  }
                  modifiers={{
                    hasOrders: orderDates,
                  }}
                  modifiersClassNames={{
                    hasOrders:
                      "bg-red-500/20 text-red-700 dark:text-red-400 font-semibold",
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
          {dateFilter && (
            <button
              onClick={() => setDateFilter(undefined)}
              className="text-muted-foreground hover:text-foreground transition p-1 shrink-0"
              title={t("common.clear")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
