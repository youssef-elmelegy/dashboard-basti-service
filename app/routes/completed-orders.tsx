import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCompletedOrdersStore } from "@/stores/completedOrdersStore";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarIcon,
  Package,
  ChevronRight,
  RefreshCw,
  Copy,
  Search,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import {
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const CompletedOrders = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const orders = useCompletedOrdersStore((state) => state.orders);
  const isLoading = useCompletedOrdersStore((state) => state.isLoading);
  const fetchCompletedOrders = useCompletedOrdersStore(
    (state) => state.fetchCompletedOrders,
  );
  const [sortDir, setSortDir] = useState<"normal" | "asc" | "desc">("normal");
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Fetch completed orders on component mount (will use cache if available)
  useEffect(() => {
    fetchCompletedOrders();
  }, [fetchCompletedOrders]);

  // Filter then sort orders based on selected criteria
  const filteredOrders = orders.filter((o) => {
    if (!query) return true;
    const ref = (o.referenceNumber || o.id || "").toString().toLowerCase();
    return ref.includes(query.trim().toLowerCase());
  });

  let sortedOrders = [...filteredOrders];
  if (sortDir === "asc") {
    sortedOrders = sortedOrders.sort(
      (a, b) =>
        new Date(a.orderedAt || 0).getTime() -
        new Date(b.orderedAt || 0).getTime(),
    );
  } else if (sortDir === "desc") {
    sortedOrders = sortedOrders.sort(
      (a, b) =>
        new Date(b.orderedAt || 0).getTime() -
        new Date(a.orderedAt || 0).getTime(),
    );
  }

  const handleRefresh = async () => {
    await fetchCompletedOrders(true); // Force refresh
  };

  const handleCopyRef = async (e: React.MouseEvent, ref: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ref);
      setCopiedRef(ref);
      setTimeout(() => setCopiedRef(null), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const getStatusInfo = (status: string | undefined) => {
    const statusMap: Record<
      string,
      { label: string; variant?: VariantProps<typeof badgeVariants>["variant"]; icon: string }
    > = {
      ready: {
        label: t("orderStatus.ready") || "Ready",
        variant: "default",
        icon: "✓",
      },
      out_for_delivery: {
        label: t("orderStatus.outForDelivery") || "Out for Delivery",
        variant: "secondary",
        icon: "🚚",
      },
      delivered: {
        label: t("orderStatus.delivered") || "Delivered",
        variant: "outline",
        icon: "📦",
      },
      cancelled: {
        label: t("orderStatus.cancelled") || "Cancelled",
        variant: "destructive",
        icon: "✕",
      },
    };
    return (
      statusMap[status || ""] || {
        label: status,
        variant: "secondary",
        icon: "?",
      }
    );
  };

  const handleRowClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="flex w-full h-full flex-col">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t("completedOrders.title") || "Completed Orders"}
          </h1>
          <p className="text-muted-foreground">
            {t("completedOrders.description") ||
              "View all orders that are ready, out for delivery, delivered, or cancelled"}
          </p>
        </div>

        {/* Search + Sort Controls */}
        <div className="flex gap-2 mb-6 items-center">
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
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {t("orders.searchByReference") ||
                    "Search by reference number"}
                </label>
                <Input
                  placeholder={
                    t("orders.enterReference") || "Enter reference number"
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
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
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder={t("orders.sortByTime") || "Sort"} />
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="ml-auto"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            {t("common.refresh") || "Refresh"}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              <p className="text-sm text-muted-foreground">
                {t("common.loading") || "Loading orders..."}
              </p>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {!isLoading && sortedOrders.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>
                    {t("orders.referenceNumber") || "Reference"}
                  </TableHead>
                  <TableHead>{t("orders.customer") || "Customer"}</TableHead>
                  <TableHead>{t("orders.status") || "Status"}</TableHead>
                  <TableHead>
                    {t("orders.deliveryDate") || "Delivery Date"}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("orders.totalPrice") || "Total Price"}
                  </TableHead>
                  <TableHead className="text-right w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(order.id)}
                    >
                      <TableCell className="font-mono font-semibold">
                        <div className="flex items-center gap-2">
                          <span>
                            {order.referenceNumber ||
                              `#${order.id.slice(0, 8)}`}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) =>
                              handleCopyRef(
                                e,
                                order.referenceNumber ||
                                  `#${order.id.slice(0, 8)}`,
                              )
                            }
                            title={t("common.copy") || "Copy"}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {copiedRef ===
                            (order.referenceNumber ||
                              `#${order.id.slice(0, 8)}`) && (
                            <span className="text-xs text-muted-foreground">
                              {t("common.copied") || "Copied"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {order.customerName}
                          </span>
                          {order.customerPhone && (
                            <span className="text-xs text-muted-foreground">
                              {order.customerPhone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status === "delivered" ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            {order.deliveredAt
                              ? format(
                                  new Date(order.deliveredAt),
                                  "MMM d, yyyy",
                                )
                              : "-"}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {order.totalPrice} EGP
                      </TableCell>
                      <TableCell className="text-right">
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedOrders.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {t("completedOrders.noOrders") || "No completed orders"}
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                {t("completedOrders.noOrdersDescription") ||
                  "There are no orders in completed states (ready, out for delivery, delivered, or cancelled)"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompletedOrders;
