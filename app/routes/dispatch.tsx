import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Truck,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserPlus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useDispatchStore } from "@/stores/dispatchStore";
import { useRegionStore } from "@/stores/regionStore";
import { useBakeryStore } from "@/stores/bakeryStore";
import AssignDriverDialog from "@/components/AssignDriverDialog";
import DriverAvatar from "@/components/DriverAvatar";
import type {
  DispatchOrder,
  DispatchDriverState,
} from "@/lib/services/order.service";
import { cn } from "@/lib/utils";

type DriverStateFilter = "all" | DispatchDriverState;

export default function DispatchPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const items = useDispatchStore((s) => s.items);
  const pagination = useDispatchStore((s) => s.pagination);
  const page = useDispatchStore((s) => s.page);
  const isLoading = useDispatchStore((s) => s.isLoading);
  const error = useDispatchStore((s) => s.error);
  const setFilters = useDispatchStore((s) => s.setFilters);
  const reload = useDispatchStore((s) => s.reload);
  const goToPage = useDispatchStore((s) => s.goToPage);

  const regions = useRegionStore((s) => s.regions);
  const fetchRegions = useRegionStore((s) => s.fetchRegions);
  const bakeries = useBakeryStore((s) => s.bakeries);
  const fetchBakeries = useBakeryStore((s) => s.fetchBakeries);

  const [regionFilter, setRegionFilter] = useState("all");
  const [bakeryFilter, setBakeryFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState<DriverStateFilter>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [dialogOrder, setDialogOrder] = useState<DispatchOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRegions();
    fetchBakeries();
  }, [fetchRegions, fetchBakeries]);

  // Debounce the reference search.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handle);
  }, [query]);

  // A bakery belongs to one region, so picking a new region invalidates the
  // current bakery choice. Reset it in the handler rather than in an effect —
  // an effect would render once with the stale pair and refetch twice.
  const handleRegionChange = (value: string) => {
    setRegionFilter(value);
    setBakeryFilter("all");
  };

  // Push filter changes into the store and reload page 1.
  useEffect(() => {
    setFilters({
      regionId: regionFilter === "all" ? undefined : regionFilter,
      bakeryId: bakeryFilter === "all" ? undefined : bakeryFilter,
      driverState: driverFilter === "all" ? undefined : driverFilter,
      q: debouncedQuery || undefined,
    });
    void reload();
  }, [
    regionFilter,
    bakeryFilter,
    driverFilter,
    debouncedQuery,
    setFilters,
    reload,
  ]);

  // Bakeries available for the bakery filter, narrowed to the chosen region.
  const bakeryOptions = useMemo(
    () =>
      regionFilter === "all"
        ? bakeries
        : bakeries.filter((b) => b.regionId === regionFilter),
    [bakeries, regionFilter],
  );

  const bakeryName = (bakeryId: string | null) =>
    (bakeryId && bakeries.find((b) => b.id === bakeryId)?.name) || "—";

  const openAssign = (order: DispatchOrder) => {
    setDialogOrder(order);
    setDialogOpen(true);
  };

  const handlePrev = () => {
    if (page > 1) void goToPage(page - 1);
  };
  const handleNext = () => {
    if (pagination && page < pagination.totalPages) void goToPage(page + 1);
  };

  const statusLabel = (status: string) =>
    t(`orderStatus.${statusKey(status)}`, { defaultValue: status });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Truck className="w-7 h-7" />
          {t("dispatch.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("dispatch.description")}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={regionFilter} onValueChange={handleRegionChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("dispatch.region")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dispatch.allRegions")}</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={bakeryFilter} onValueChange={setBakeryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("dispatch.bakery")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dispatch.allBakeries")}</SelectItem>
            {bakeryOptions.map((bakery) => (
              <SelectItem key={bakery.id} value={bakery.id}>
                {bakery.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={driverFilter}
          onValueChange={(v) => setDriverFilter(v as DriverStateFilter)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("dispatch.driverState")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dispatch.allDriverStates")}</SelectItem>
            <SelectItem value="unassigned">{t("dispatch.unassigned")}</SelectItem>
            <SelectItem value="assigned">{t("dispatch.assigned")}</SelectItem>
            <SelectItem value="accepted">{t("dispatch.accepted")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dispatch.searchByReference")}
            className="ps-8"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => void reload({ force: true })}
          disabled={isLoading}
          className="ms-auto"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          {t("common.refresh")}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dispatch.columns.reference")}</TableHead>
              <TableHead>{t("dispatch.columns.bakery")}</TableHead>
              <TableHead>{t("dispatch.columns.region")}</TableHead>
              <TableHead>{t("dispatch.columns.status")}</TableHead>
              <TableHead>{t("dispatch.columns.driver")}</TableHead>
              <TableHead className="text-end">
                {t("dispatch.columns.action")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{t("common.loading")}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  {t("dispatch.noOrders")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">
                    #{order.referenceNumber || order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{bakeryName(order.bakeryId)}</TableCell>
                  <TableCell>{order.regionName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {statusLabel(order.orderStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DriverChip order={order} />
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openAssign(order)}
                    >
                      <UserPlus className="w-4 h-4" />
                      {order.driverId
                        ? t("dispatch.reassign")
                        : t("dispatch.assign")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t("dispatch.pageOf", {
              page: pagination.page,
              totalPages: pagination.totalPages,
              defaultValue: `Page ${pagination.page} of ${pagination.totalPages}`,
            })}{" "}
            · {pagination.total} {t("dispatch.totalOrders")}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={page <= 1 || isLoading}
            >
              {isRTL ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={isLoading || page >= pagination.totalPages}
            >
              {isRTL ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <AssignDriverDialog
        order={dialogOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

/** Map an order status to its i18n key under `orderStatus`. */
function statusKey(status: string): string {
  if (status === "out_for_delivery") return "outForDelivery";
  return status;
}

/** Renders the driver assignment state for a dispatch row. */
function DriverChip({ order }: { order: DispatchOrder }) {
  const { t } = useTranslation();

  // Accepted: server populated driverData with the driver's snapshot.
  if (order.driverData) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <DriverAvatar
          name={order.driverData.name}
          image={order.driverData.profileImage}
          className="size-7"
        />
        <span className="flex flex-col leading-tight">
          <span className="font-medium">{order.driverData.name}</span>
          <span className="text-xs text-emerald-600">
            {t("dispatch.accepted")}
          </span>
        </span>
      </span>
    );
  }

  // Assigned but not yet accepted (no driverData snapshot yet → placeholder).
  if (order.driverId) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <DriverAvatar name={order.assignedDriverName} className="size-7" />
        <span className="flex flex-col leading-tight">
          <span className="font-medium">
            {order.assignedDriverName ?? t("dispatch.assigned")}
          </span>
          <span className="text-xs text-amber-600">
            {t("dispatch.awaiting")}
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="text-sm text-muted-foreground">
      {t("dispatch.unassigned")}
    </span>
  );
}
