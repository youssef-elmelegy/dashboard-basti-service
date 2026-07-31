import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  orderApi,
  type OrderFinancialsResponse,
  type OrderFinancialsRow,
} from "@/lib/services/order.service";
import { CartTypeIcon } from "@/components/CartTypeIcon";

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Status badge tint — `print:` variants render stronger in PDF
const STATUS_TINT: Record<string, string> = {
  ready:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 print:!bg-amber-200 print:!text-amber-900",
  out_for_delivery:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 print:!bg-blue-200 print:!text-blue-900",
  delivered:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 print:!bg-emerald-200 print:!text-emerald-900",
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const tint = STATUS_TINT[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tint}`}>
      {t(`orderStatus.${status}`)}
    </span>
  );
}

function BakeryTableBody({
  rows,
  formatDate,
}: {
  rows: OrderFinancialsRow[];
  formatDate: (iso: string) => string;
}) {
  return (
    <>
      {rows.map((order) => (
        <TableRow key={order.orderId}>
          <TableCell className="font-mono font-medium">
            <span className="flex items-center gap-2">
              <CartTypeIcon cartType={order.cartType} />
              <span>#{order.referenceNumber || order.orderId.slice(0, 8)}</span>
            </span>
          </TableCell>
          <TableCell className="whitespace-nowrap">{formatDate(order.createdAt)}</TableCell>
          <TableCell>
            <StatusBadge status={order.orderStatus} />
          </TableCell>
          <TableCell className="text-end tabular-nums">{fmt(order.finalPrice)}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function BakeryFinancePage() {
  const { t, i18n } = useTranslation();
  const { admin } = useAuth();
  const isRTL = i18n.language === "ar";
  const bakeryId = admin?.bakeryId;

  const defaultRange = getDefaultRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounced dates — the request only fires after the user pauses picking
  const [debouncedStart, setDebouncedStart] = useState(startDate);
  const [debouncedEnd, setDebouncedEnd] = useState(endDate);

  const [data, setData] = useState<OrderFinancialsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString(
          i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB",
        )
      : "—";

  // Debounce date changes (typing or picker fiddling)
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedStart(startDate);
      setDebouncedEnd(endDate);
    }, 600);
    return () => clearTimeout(handle);
  }, [startDate, endDate]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedStart, debouncedEnd, pageSize]);

  // Fetch financials whenever filters or pagination change
  useEffect(() => {
    if (!bakeryId) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await orderApi.getBakeryFinancials(bakeryId, {
          from: debouncedStart || undefined,
          to: debouncedEnd || undefined,
          page,
          limit: pageSize,
        });

        if (cancelled) return;

        if (response.success && response.data) {
          setData(response.data);
        } else {
          setData(null);
          setError(response.message || t("finance.loadError"));
        }
      } catch (err) {
        if (cancelled) return;
        setData(null);
        setError(err instanceof Error ? err.message : t("finance.loadError"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [bakeryId, debouncedStart, debouncedEnd, page, pageSize, t]);

  const rows = data?.rows ?? [];
  const totals = data?.total;
  const totalCount = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);
  const safePage = Math.min(page, totalPages);

  const handleDownload = () => {
    // Browsers use document.title as the suggested PDF filename when printing.
    const sanitize = (s: string) =>
      s.replace(/[<>:"/\\|?*\x00-\x1f]/g, "").replace(/\s+/g, " ").trim();
    const filename = `Basti Service - ${sanitize(t("finance.myBakeryTitle"))} - ${startDate}_${endDate}`;

    const originalTitle = document.title;
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    document.title = filename;
    window.print();
  };

  const tableHeaders = (
    <TableHeader>
      <TableRow>
        <TableHead className="text-start">
          {t("finance.columns.orderId")}
        </TableHead>
        <TableHead className="text-start">
          {t("finance.columns.date")}
        </TableHead>
        <TableHead className="text-start">
          {t("finance.columns.status")}
        </TableHead>
        <TableHead className="text-end">{t("finance.columns.amount")}</TableHead>
      </TableRow>
    </TableHeader>
  );

  const sumFooter = totals && rows.length > 0 && (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={3} className="font-semibold">
          {t("finance.sum")} ({totalCount})
        </TableCell>
        <TableCell className="text-end font-semibold tabular-nums">
          {fmt(totals.finalPrice)}
        </TableCell>
      </TableRow>
    </TableFooter>
  );

  // Manager has no bakery assigned — nothing to show.
  if (!bakeryId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
        <AlertCircle className="w-6 h-6" />
        <p>{t("finance.noBakeryAssigned")}</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 12mm; size: A4 portrait; }
          body > * { visibility: hidden; }
          .finance-print-area, .finance-print-area * { visibility: visible; }
          .finance-print-area {
            position: fixed;
            inset: 0;
            padding: 16px 20px;
            background: white;
            color: #0f172a;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          }
          .finance-print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .finance-print-area table { border-collapse: collapse; width: 100%; font-size: 12px; }
          .finance-print-area thead { display: table-header-group; }
          .finance-print-area tfoot { display: table-footer-group; }
          .finance-print-area tr { page-break-inside: avoid; }
          .finance-print-area th, .finance-print-area td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
          }
        }
      `}</style>

      {/* Print-only area: current page only (server-paginated) */}
      <div className="finance-print-area hidden print:block">
        <div className="flex items-end justify-between mb-3 pb-2 border-b-2 border-slate-900">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Basti Service</h1>
            <p className="text-sm text-slate-700">{t("finance.myBakeryTitle")}</p>
          </div>
          <div className="text-end text-xs text-slate-700 leading-relaxed">
            <p>{startDate} — {endDate}</p>
            <p>{t("finance.sum")}: {totalCount}</p>
          </div>
        </div>
        <Table>
          {tableHeaders}
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                  {t("finance.noOrders")}
                </TableCell>
              </TableRow>
            ) : (
              <BakeryTableBody rows={rows} formatDate={formatDate} />
            )}
          </TableBody>
          {sumFooter}
        </Table>
      </div>

      {/* Screen UI */}
      <div className="print:hidden h-full flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{t("finance.breadcrumbFinance")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-3xl font-bold">{t("finance.myBakeryTitle")}</h1>
        </div>

        {/* Filters + Download */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background text-sm">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent outline-none"
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent outline-none"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isLoading || rows.length === 0}
            className="gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 ms-auto"
          >
            <Download className="w-4 h-4" />
            {t("finance.download")}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            {tableHeaders}
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>{t("common.loading")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    {t("finance.noOrders")}
                  </TableCell>
                </TableRow>
              ) : (
                <BakeryTableBody rows={rows} formatDate={formatDate} />
              )}
            </TableBody>
            {sumFooter}
          </Table>
        </div>

        {/* Pagination controls */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("finance.showing")} {Math.min((safePage - 1) * pageSize + 1, totalCount)}–{Math.min(safePage * pageSize, totalCount)} {t("finance.of")} {totalCount}
            </span>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("finance.rowsPerPage")}</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <span className="text-muted-foreground w-24 text-center">
                {t("finance.page")} {safePage} / {totalPages}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(1)}
                  disabled={safePage === 1 || isLoading}
                >
                  {isRTL ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1 || isLoading}
                >
                  {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages || isLoading}
                >
                  {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages || isLoading}
                >
                  {isRTL ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
