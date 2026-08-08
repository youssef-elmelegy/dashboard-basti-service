import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { useBakeryStore } from "@/stores/bakeryStore";
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
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Column color tokens — `print:` variants render stronger in PDF
const COL_GREEN =
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 print:!bg-emerald-200 print:!text-emerald-900";
const COL_BASTI = COL_GREEN;
const COL_ADDON = COL_GREEN;
const COL_BAKERY =
  "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 print:!bg-amber-200 print:!text-amber-900";
const COL_DELIVERY =
  "bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 print:!bg-violet-200 print:!text-violet-900";
const COL_FEE =
  "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 print:!bg-rose-200 print:!text-rose-900";
const COL_NET = COL_GREEN;

const HDR_GREEN =
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 print:!bg-emerald-300 print:!text-emerald-950";
const HDR_BASTI = HDR_GREEN;
const HDR_ADDON = HDR_GREEN;
const HDR_BAKERY =
  "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 print:!bg-amber-300 print:!text-amber-950";
const HDR_DELIVERY =
  "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 print:!bg-violet-300 print:!text-violet-950";
const HDR_FEE =
  "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 print:!bg-rose-300 print:!text-rose-950";
const HDR_NET = HDR_GREEN;

// gatewayName from backend → i18n key under finance.gateways
const GATEWAY_LABEL_KEY: Record<string, string> = {
  masarat: "finance.gateways.masarat",
  tadawul: "finance.gateways.tadawul",
};

function OrderTableBody({ rows }: { rows: OrderFinancialsRow[] }) {
  const { t } = useTranslation();
  return (
    <>
      {rows.map((order) => {
        const gatewayLabelKey = GATEWAY_LABEL_KEY[order.gatewayName];
        const totalValue = order.finalPriceBeforeGatewayFee;
        const finalValue = order.finalPrice;
        return (
          <TableRow key={order.orderId}>
            <TableCell className="font-mono font-medium">
              <span className="flex items-center gap-2">
                <CartTypeIcon cartType={order.cartType} />
                <span>
                  #{order.referenceNumber || order.orderId.slice(0, 8)}
                </span>
              </span>
            </TableCell>
            <TableCell>{order.bakeryName}</TableCell>
            <TableCell className="text-end tabular-nums">
              {fmt(totalValue)}
            </TableCell>
            <TableCell className={`text-end tabular-nums ${COL_FEE}`}>
              {order.gatewayFee > 0 ? (
                <span className="flex items-center justify-end gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {gatewayLabelKey ? t(gatewayLabelKey) : order.gatewayName}
                  </span>
                  <span>−{fmt(order.gatewayFee)}</span>
                </span>
              ) : (
                <span className="opacity-50">{t("finance.gateways.none")}</span>
              )}
            </TableCell>
            <TableCell className={`text-end tabular-nums ${COL_NET}`}>
              {fmt(finalValue)}
            </TableCell>
            <TableCell className={`text-end tabular-nums ${COL_BASTI}`}>
              {fmt(order.bastiAmount)}
            </TableCell>
            <TableCell className={`text-end tabular-nums ${COL_ADDON}`}>
              {fmt(order.addonsTotal)}
            </TableCell>
            <TableCell className={`text-end tabular-nums ${COL_BAKERY}`}>
              {fmt(order.bakeryAmount)}
            </TableCell>
            <TableCell className={`text-end tabular-nums ${COL_DELIVERY}`}>
              {fmt(order.deliveryAmount)}
            </TableCell>
            <TableCell className={`text-end tabular-nums ${COL_BASTI}`}>
              {fmt(order.bastiDeliveryAmount)}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export default function FinanceOrdersPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const bakeries = useBakeryStore((state) => state.bakeries);
  const fetchBakeries = useBakeryStore((state) => state.fetchBakeries);

  const defaultRange = getDefaultRange();
  const [selectedBakery, setSelectedBakery] = useState("all");
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

  // Full unpaginated result set, populated only while exporting to PDF.
  const [printRows, setPrintRows] = useState<OrderFinancialsRow[] | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchBakeries();
  }, [fetchBakeries]);

  // Debounce date changes (typing or picker fiddling)
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedStart(startDate);
      setDebouncedEnd(endDate);
    }, 600);
    return () => clearTimeout(handle);
  }, [startDate, endDate]);

  // Reset to page 1 whenever filters change (use debounced dates so we don't reset mid-pick)
  useEffect(() => {
    setPage(1);
  }, [selectedBakery, debouncedStart, debouncedEnd, pageSize]);

  // Fetch financials whenever filters or pagination change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await orderApi.getFinancials({
          bakeryId: selectedBakery === "all" ? undefined : selectedBakery,
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
  }, [selectedBakery, debouncedStart, debouncedEnd, page, pageSize, t]);

  const rows = data?.rows ?? [];
  const totals = data?.total;
  const totalCount = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);
  const safePage = Math.min(page, totalPages);
  const totalValue = totals?.finalPriceBeforeGatewayFee ?? 0;
  const finalValue = totals?.finalPrice ?? 0;

  const selectedBakeryName =
    selectedBakery === "all"
      ? null
      : (bakeries.find((b) => b.id === selectedBakery)?.name ?? null);

  const handleDownload = async () => {
    // The screen table is server-paginated, but the export must contain every
    // order matching the current filters — so fetch the full set first.
    setIsExporting(true);
    let exportRows: OrderFinancialsRow[] = [];
    try {
      // The API caps `limit` server-side, so walk the pages rather than asking
      // for everything at once — a single huge limit gets silently truncated.
      const EXPORT_PAGE_SIZE = 100;
      for (let p = 1; ; p++) {
        const response = await orderApi.getFinancials({
          bakeryId: selectedBakery === "all" ? undefined : selectedBakery,
          from: debouncedStart || undefined,
          to: debouncedEnd || undefined,
          page: p,
          limit: EXPORT_PAGE_SIZE,
        });

        if (!response.success || !response.data) {
          setError(response.message || t("finance.loadError"));
          setIsExporting(false);
          return;
        }

        exportRows = exportRows.concat(response.data.rows);

        const pages = response.data.pagination.totalPages ?? 1;
        if (p >= pages || response.data.rows.length === 0) break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("finance.loadError"));
      setIsExporting(false);
      return;
    }

    // Hand off to the effect below: printing has to happen *after* React has
    // committed these rows to the DOM, otherwise window.print() snapshots the
    // old (paginated) table.
    setIsExporting(false);
    setPrintRows(exportRows);
  };

  // Fires once printRows lands in the DOM, so the dialog sees the full table.
  useEffect(() => {
    if (printRows === null) return;

    // Browsers use document.title as the suggested PDF filename when printing.
    // Sanitize anything that breaks filenames on common OSes.
    const sanitize = (s: string) =>
      s
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const bakeryPart = sanitize(selectedBakeryName ?? t("finance.allBakeries"));
    const filename = `Basti Service - ${bakeryPart} - ${startDate}_${endDate}`;

    const originalTitle = document.title;
    const restore = () => {
      document.title = originalTitle;
      setPrintRows(null);
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    document.title = filename;
    window.print();

    return () => window.removeEventListener("afterprint", restore);
    // Only re-run when the print payload changes; the filename inputs are read
    // at print time and must not retrigger the dialog on their own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printRows]);

  const tableHeaders = (
    <TableHeader>
      <TableRow>
        <TableHead className="text-start">
          {t("finance.columns.orderId")}
        </TableHead>
        <TableHead className="text-start">
          {t("finance.columns.bakery")}
        </TableHead>
        <TableHead className="text-end">{t("finance.columns.total")}</TableHead>
        <TableHead className={`text-end ${HDR_FEE}`}>
          {t("finance.columns.gatewayFee")}
        </TableHead>
        <TableHead className={`text-end ${HDR_NET}`}>
          {t("finance.columns.finalPrice")}
        </TableHead>
        <TableHead className={`text-end ${HDR_BASTI}`}>
          {t("finance.columns.bastiAmount")}
        </TableHead>
        <TableHead className={`text-end ${HDR_ADDON}`}>
          {t("finance.columns.addonValue")}
        </TableHead>
        <TableHead className={`text-end ${HDR_BAKERY}`}>
          {t("finance.columns.bakeryAmount")}
        </TableHead>
        <TableHead className={`text-end ${HDR_DELIVERY}`}>
          {t("finance.columns.delivery")}
        </TableHead>
        <TableHead className={`text-end ${HDR_BASTI}`}>
          {t("finance.columns.bastiDelivery")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );

  const sumFooter = totals && rows.length > 0 && (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={2} className="font-semibold">
          {t("finance.sum")} ({totalCount})
        </TableCell>
        <TableCell className="text-end font-semibold tabular-nums">
          {fmt(totalValue)}
        </TableCell>
        <TableCell className={`text-end font-semibold tabular-nums ${HDR_FEE}`}>
          −{fmt(totals.gatewayFeeTotal)}
        </TableCell>
        <TableCell className={`text-end font-semibold tabular-nums ${HDR_NET}`}>
          {fmt(finalValue)}
        </TableCell>
        <TableCell
          className={`text-end font-semibold tabular-nums ${HDR_BASTI}`}
        >
          {fmt(totals.bastiTotal)}
        </TableCell>
        <TableCell
          className={`text-end font-semibold tabular-nums ${HDR_ADDON}`}
        >
          {fmt(totals.addonsTotal)}
        </TableCell>
        <TableCell
          className={`text-end font-semibold tabular-nums ${HDR_BAKERY}`}
        >
          {fmt(totals.bakeryTotal)}
        </TableCell>
        <TableCell
          className={`text-end font-semibold tabular-nums ${HDR_DELIVERY}`}
        >
          {fmt(totals.deliveryAmount)}
        </TableCell>
        <TableCell
          className={`text-end font-semibold tabular-nums ${HDR_BASTI}`}
        >
          {fmt(totals.bastiDeliveryAmount)}
        </TableCell>
      </TableRow>
    </TableFooter>
  );

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 12mm; size: A4 landscape; }

          /* Hide the app chrome by removing it from layout entirely. Using
             visibility here would leave the hidden boxes occupying space and
             push the report down the page. */
          body > * { display: none !important; }

          /* The print area is portaled to <body> while printing, so it is a
             direct child and must be re-shown after the blanket rule above. */
          body > .finance-print-area { display: block !important; }

          /* Must stay in normal flow — a fixed/absolute element is trapped in
             the first page box and silently truncates the table. */
          .finance-print-area {
            position: static !important;
            padding: 0;
            background: white;
            color: #0f172a;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          }
          .finance-print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* shadcn wraps tables in an overflow-x container; overflow also
             breaks page flow, so neutralize it for print. */
          .finance-print-area [data-slot="table-container"] {
            overflow: visible !important;
            position: static !important;
          }

          .finance-print-area table { border-collapse: collapse; width: 100%; font-size: 11px; }
          /* Repeat the header on every page and keep the totals last. */
          .finance-print-area thead { display: table-header-group; }
          .finance-print-area tfoot { display: table-footer-group; }
          .finance-print-area tr { page-break-inside: avoid; break-inside: avoid; }
          .finance-print-area th, .finance-print-area td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
          }
        }
      `}</style>

      {/* Print-only area: every row matching the filters, not just this page.
          Portaled to <body> so the print CSS can hide app chrome with
          `body > *` without also hiding this subtree along with its parents. */}
      {createPortal(
        <div className="finance-print-area hidden print:block">
        <div className="flex items-end justify-between mb-3 pb-2 border-b-2 border-slate-900">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              Basti Service
            </h1>
            <p className="text-sm text-slate-700">{t("finance.title")}</p>
          </div>
          <div className="text-end text-xs text-slate-700 leading-relaxed">
            <p className="font-semibold text-sm text-slate-900">
              {selectedBakeryName ?? t("finance.allBakeries")}
            </p>
            <p>
              {startDate} — {endDate}
            </p>
            <p>
              {t("finance.sum")}: {totalCount}
            </p>
          </div>
        </div>
        <Table>
          {tableHeaders}
          <TableBody>
            {(printRows ?? rows).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-gray-400"
                >
                  {t("finance.noOrders")}
                </TableCell>
              </TableRow>
            ) : (
              <OrderTableBody rows={printRows ?? rows} />
            )}
          </TableBody>
          {sumFooter}
        </Table>
        </div>,
        document.body,
      )}

      {/* Screen UI */}
      <div className="print:hidden h-full flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/finance/orders">
                  {t("finance.breadcrumbFinance")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t("finance.breadcrumbOrders")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-3xl font-bold">{t("finance.title")}</h1>
        </div>

        {/* Filters + Download */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedBakery} onValueChange={setSelectedBakery}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("finance.allBakeries")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("finance.allBakeries")}</SelectItem>
              {bakeries.map((bakery) => (
                <SelectItem key={bakery.id} value={bakery.id}>
                  {bakery.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            disabled={isLoading || isExporting || rows.length === 0}
            className="gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 ms-auto"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
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
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>{t("common.loading")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-12 text-muted-foreground"
                  >
                    {t("finance.noOrders")}
                  </TableCell>
                </TableRow>
              ) : (
                <OrderTableBody rows={rows} />
              )}
            </TableBody>
            {sumFooter}
          </Table>
        </div>

        {/* Pagination controls */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("finance.showing")}{" "}
              {Math.min((safePage - 1) * pageSize + 1, totalCount)}–
              {Math.min(safePage * pageSize, totalCount)} {t("finance.of")}{" "}
              {totalCount}
            </span>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {t("finance.rowsPerPage")}
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                >
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
                  {isRTL ? (
                    <ChevronsRight className="w-4 h-4" />
                  ) : (
                    <ChevronsLeft className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1 || isLoading}
                >
                  {isRTL ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages || isLoading}
                >
                  {isRTL ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages || isLoading}
                >
                  {isRTL ? (
                    <ChevronsLeft className="w-4 h-4" />
                  ) : (
                    <ChevronsRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
