import { format } from "date-fns";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyReferenceButton } from "@/components/CopyReferenceButton";
import { DaysLeftBadge } from "@/components/DaysLeftBadge";
import { useUnassignedOrdersStore } from "@/stores/unassignedOrdersStore";
import { useRegionStore } from "@/stores/regionStore";
import { type Order } from "@/data/orders";
import { CalendarIcon, X, Search } from "lucide-react";
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
  t: (key: string) => string;
};

function formatBakeryType(
  type: string,
  t: (key: string) => string,
): string {
  const key = `orders.type.${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
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

function DraggableOrderCard({
  order,
  onNavigate,
  t,
}: DraggableOrderCardProps) {
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
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(order.id);
            }}
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors w-fit cursor-pointer"
            title={`${t("common.viewDetails")} ${order.referenceNumber || order.id}`}
          >
            {order.referenceNumber || `#${order.id}`}
          </button>
          <CopyReferenceButton
            value={order.referenceNumber || order.id}
            title={t("orders.copyReference")}
          />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-semibold truncate">
            {formatProductName(order.productName, t)}
          </CardTitle>
          <p className="text-xs text-muted-foreground truncate mb-0.5">
            {order.customerName}
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground/80">
              {formatBakeryType(order.type, t)}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {format(new Date(order.deliverDay), "MMM d, yyyy")}
            </span>
            <span
              className="ms-1 px-1.5 py-0.5 rounded bg-accent text-foreground/80 truncate max-w-24"
              title={order.region}
            >
              {order.region}
            </span>
            <DaysLeftBadge date={order.deliverDay} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div /> {/* Spacer */}
          <span
            className={`inline-flex items-center justify-center min-w-8 px-3 py-1 rounded-lg font-bold text-xs shadow-sm ${slotBg} text-black dark:text-white`}
            title={t("orderDetail.capacitySlots")}
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

  const orders = useUnassignedOrdersStore((s) => s.orders);
  const pagination = useUnassignedOrdersStore((s) => s.pagination);
  const isLoading = useUnassignedOrdersStore((s) => s.isLoading);
  const isLoadingMore = useUnassignedOrdersStore((s) => s.isLoadingMore);
  const setStoreFilters = useUnassignedOrdersStore((s) => s.setFilters);
  const reload = useUnassignedOrdersStore((s) => s.reload);
  const fetchMore = useUnassignedOrdersStore((s) => s.fetchMore);

  // UI-level controls (mapped into the store's filters on change).
  // "normal" = no sorting hint sent → backend default (desc on createdAt).
  const [sortDir, setSortDir] = React.useState<"normal" | "asc" | "desc">(
    "normal",
  );
  const [regionFilter, setRegionFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const regions = useRegionStore((state) => state.regions);
  const fetchRegions = useRegionStore((state) => state.fetchRegions);

  React.useEffect(() => {
    if (regions.length === 0) {
      fetchRegions().catch((err) =>
        console.error("Failed to fetch regions:", err),
      );
    }
  }, [regions.length, fetchRegions]);

  // Debounce the search query so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchTerm);
  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // Push filter changes into the store, then reload page 1.
  React.useEffect(() => {
    setStoreFilters({
      regionId: regionFilter === "all" ? undefined : regionFilter,
      type: typeFilter === "all" ? undefined : typeFilter,
      q: debouncedSearch || undefined,
      sort: sortDir === "normal" ? undefined : sortDir,
    });
    reload();
  }, [
    regionFilter,
    typeFilter,
    debouncedSearch,
    sortDir,
    setStoreFilters,
    reload,
  ]);

  // Orders come pre-filtered and pre-sorted from the backend.
  const sortedOrders = orders;

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
    onClose?.();
  };

  // Infinite scroll — load the next page when we approach the bottom.
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      void fetchMore();
    }
  }, [fetchMore]);

  // Droppable target so an assigned order can be dragged back here to return
  // it to the unassigned pool. Shares one element with the scroll container.
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: "unassigned-sidebar",
  });
  const setListRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      setDropRef(node);
    },
    [setDropRef],
  );

  return (
    <Sidebar
      collapsible="none"
      className="flex flex-col h-full w-full bg-sidebar"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-lg">
              {t("orders.unassignedOrders")}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {t("orders.dragToAssign")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={regionFilter}
              onValueChange={setRegionFilter}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder={t("orders.filterByRegion")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("orders.allRegions")}</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Close button for mobile */}
            {onClose && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="lg:hidden p-2 -me-2 hover:bg-accent rounded-md transition-colors"
                title={t("buttons.close")}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <SelectTrigger className="flex-1 min-w-0 h-8 text-xs">
              <SelectValue placeholder={t("orders.filterByType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("orders.allTypes")}</SelectItem>
              <SelectItem value="big_cakes">
                {t("orders.type.big_cakes")}
              </SelectItem>
              <SelectItem value="small_cakes">
                {t("orders.type.small_cakes")}
              </SelectItem>
              <SelectItem value="others">{t("orders.type.others")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Search by Reference Number */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 shrink-0 flex items-center justify-center"
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

          <Select
            value={sortDir}
            onValueChange={(v) => setSortDir(v as "normal" | "asc" | "desc")}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <SelectTrigger className="flex-1 min-w-0 h-8 text-xs">
              <SelectValue placeholder={t("orders.sortByTime")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">
                {t("orders.sort.normal") || "Normal"}
              </SelectItem>
              <SelectItem value="asc">
                {t("orders.sort.asc") || "Oldest First"}
              </SelectItem>
              <SelectItem value="desc">
                {t("orders.sort.desc") || "Newest First"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          ref={setListRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto custom-scrollbar mb-2 rounded-md transition-shadow ${
            isOver ? "ring-2 ring-primary ring-inset" : ""
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center flex-1 py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-e-transparent" />
                <p className="text-xs text-muted-foreground">
                  {t("common.loading") || "Loading..."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedOrders.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t("orders.noOrders")}
                </div>
              ) : (
                <>
                  {sortedOrders.map((order: Order) => (
                    <DraggableOrderCard
                      key={order.id}
                      order={order}
                      onNavigate={handleOrderClick}
                      t={t}
                    />
                  ))}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-e-transparent" />
                    </div>
                  )}
                  {pagination &&
                    pagination.page >= pagination.totalPages &&
                    sortedOrders.length > 0 && (
                      <div className="text-center py-3 text-xs text-muted-foreground">
                        {pagination.total}{" "}
                        {t("orders.totalShown") || "total"}
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </div>
        <SidebarSeparator className="mx-0 w-full mb-2" />
      </SidebarContent>
    </Sidebar>
  );
}
