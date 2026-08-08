import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDriverStore } from "@/stores/driverStore";
import { useCan } from "@/hooks/useAuth";
import { useRegionStore } from "@/stores/regionStore";
import { cn } from "@/lib/utils";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  preparing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ready: "bg-green-500/10 text-green-500 border-green-500/20",
  out_for_delivery: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  delivered: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const REPORTS_LIMIT = 10;
const ORDERS_LIMIT = 10;

export default function DriverDetailPage() {
  const { id: regionId = "", driverId = "" } = useParams<{
    id: string;
    driverId: string;
  }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const driver = useDriverStore((s) => s.currentDriver);
  const isDriverLoading = useDriverStore((s) => s.isDriverLoading);
  const fetchDriver = useDriverStore((s) => s.fetchDriver);
  const reports = useDriverStore((s) => s.reports);
  const reportsPagination = useDriverStore((s) => s.reportsPagination);
  const isReportsLoading = useDriverStore((s) => s.isReportsLoading);
  const fetchReports = useDriverStore((s) => s.fetchReports);
  const orders = useDriverStore((s) => s.orders);
  const ordersPagination = useDriverStore((s) => s.ordersPagination);
  const isOrdersLoading = useDriverStore((s) => s.isOrdersLoading);
  const fetchOrders = useDriverStore((s) => s.fetchOrders);
  const updateDueAmount = useDriverStore((s) => s.updateDueAmount);
  const resetDetail = useDriverStore((s) => s.resetDetail);
  const error = useDriverStore((s) => s.error);
  const clearError = useDriverStore((s) => s.clearError);

  const regions = useRegionStore((s) => s.regions);
  const fetchRegions = useRegionStore((s) => s.fetchRegions);

  const [reportsPage, setReportsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const canWriteDrivers = useCan("writeDrivers");
  const [isEditingDue, setIsEditingDue] = useState(false);
  const [dueInput, setDueInput] = useState("");
  const [savingDue, setSavingDue] = useState(false);

  const driverNameForBack = `/management/regions/${regionId}/drivers`;

  useEffect(() => {
    fetchRegions();
    return () => resetDetail();
  }, [fetchRegions, resetDetail]);

  useEffect(() => {
    if (driverId) fetchDriver(driverId);
  }, [driverId, fetchDriver]);

  useEffect(() => {
    if (driverId) fetchReports(driverId, { page: reportsPage, limit: REPORTS_LIMIT });
  }, [driverId, reportsPage, fetchReports]);

  useEffect(() => {
    if (driverId)
      fetchOrders(driverId, {
        page: ordersPage,
        limit: ORDERS_LIMIT,
        status: statusFilter === "all" ? undefined : [statusFilter],
      });
  }, [driverId, ordersPage, statusFilter, fetchOrders]);

  const startEditDue = () => {
    setDueInput(String(driver?.dueAmount ?? 0));
    setIsEditingDue(true);
  };

  const saveDue = async () => {
    const value = Number(dueInput);
    if (Number.isNaN(value) || value < 0) return;
    setSavingDue(true);
    try {
      await updateDueAmount(driverId, value);
      setIsEditingDue(false);
    } catch (e) {
      console.error("Failed to update due amount:", e);
    } finally {
      setSavingDue(false);
    }
  };

  const formatStatus = (status: string | null) => {
    if (!status) return "—";
    const translated = t(`statuses.${status}`);
    return translated === `statuses.${status}` ? status : translated;
  };

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(
          i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB",
        )
      : "—";

  const regionName =
    regions.find((r) => r.id === driver?.regionId)?.name || driver?.regionId || "—";

  if (isDriverLoading && !driver) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">{t("drivers.driverNotFound")}</h1>
        <Button onClick={() => navigate(driverNameForBack)}>
          {t("drivers.backToDrivers")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/management/regions">
              {t("drivers.breadcrumbRegions")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={driverNameForBack}>{t("drivers.title")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{driver.name || driver.email}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-sm text-red-600 hover:text-red-800 mt-1 underline"
            >
              {t("common.dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* Details card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              {driver.profileImage && (
                <AvatarImage src={driver.profileImage} alt={driver.name || driver.email} />
              )}
              <AvatarFallback className="text-lg font-medium">
                {(driver.name || driver.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{driver.name || "—"}</CardTitle>
              <p className="text-sm text-muted-foreground">{driver.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("drivers.phone")}</p>
            <p className="font-medium">{driver.phoneNumber || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("drivers.region")}</p>
            <p className="font-medium">{regionName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("driverTable.status")}</p>
            <p
              className={cn(
                "font-medium",
                driver.isBlocked ? "text-red-600" : "text-green-600",
              )}
            >
              {driver.isBlocked ? t("driverTable.blocked") : t("driverTable.active")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("drivers.dueAmount")}</p>
            {isEditingDue ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={dueInput}
                  onChange={(e) => setDueInput(e.target.value)}
                  className="h-8 w-28"
                />
                <Button size="sm" onClick={saveDue} disabled={savingDue}>
                  {savingDue ? t("common.loading") : t("common.save")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingDue(false)}
                  disabled={savingDue}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-medium">{Number(driver.dueAmount ?? 0).toFixed(2)}</p>
                {/* PATCH :id/due-amount is super_admin-only; others read it. */}
                {canWriteDrivers && (
                  <button
                    onClick={startEditDue}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={t("drivers.editDueAmount")}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle>{t("drivers.reports")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isReportsLoading && reports.length === 0 ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("drivers.noReports")}</p>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("reportTable.reporter")}</TableHead>
                      <TableHead>{t("reportTable.phone")}</TableHead>
                      <TableHead>{t("reportTable.body")}</TableHead>
                      <TableHead>{t("reportTable.date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {[report.user.firstName, report.user.lastName]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </TableCell>
                        <TableCell>{report.user.phoneNumber || "—"}</TableCell>
                        <TableCell className="max-w-md">{report.reportBody}</TableCell>
                        <TableCell>{formatDate(report.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("common.page")} {reportsPagination.page} /{" "}
                  {reportsPagination.totalPages} ({reportsPagination.total})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reportsPagination.page <= 1 || isReportsLoading}
                    onClick={() => setReportsPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("common.previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      reportsPagination.page >= reportsPagination.totalPages ||
                      isReportsLoading
                    }
                    onClick={() => setReportsPage((p) => p + 1)}
                  >
                    {t("common.next")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order history */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{t("drivers.orderHistory")}</CardTitle>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setOrdersPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("drivers.allStatuses")}</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isOrdersLoading && orders.length === 0 ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("drivers.noOrders")}</p>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("orderTable.reference")}</TableHead>
                      <TableHead>{t("orderTable.status")}</TableHead>
                      <TableHead>{t("orderTable.customer")}</TableHead>
                      <TableHead>{t("orderTable.createdAt")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <TableCell className="font-medium">
                          {order.referenceNumber || order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              order.orderStatus
                                ? statusColors[order.orderStatus]
                                : undefined,
                            )}
                          >
                            {formatStatus(order.orderStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.userData
                            ? `${order.userData.firstName} ${order.userData.lastName}`
                            : "—"}
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("common.page")} {ordersPagination.page} /{" "}
                  {ordersPagination.totalPages} ({ordersPagination.total})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ordersPagination.page <= 1 || isOrdersLoading}
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("common.previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      ordersPagination.page >= ordersPagination.totalPages ||
                      isOrdersLoading
                    }
                    onClick={() => setOrdersPage((p) => p + 1)}
                  >
                    {t("common.next")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
