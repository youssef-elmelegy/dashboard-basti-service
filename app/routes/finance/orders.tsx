import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

interface FinanceOrder {
  id: string;
  bakeryName: string;
  total: number;
  delivery: number;
  bastiAmount: number;
  bakeryAmount: number;
  addonValue: number;
  date: string;
}

const DUMMY_ORDERS: FinanceOrder[] = [
  { id: "ORD-001", bakeryName: "Sweet Dreams", total: 250, delivery: 25, bastiAmount: 50, bakeryAmount: 175, addonValue: 30, date: "2026-05-02" },
  { id: "ORD-002", bakeryName: "Cake Palace", total: 180, delivery: 18, bastiAmount: 36, bakeryAmount: 126, addonValue: 0, date: "2026-05-03" },
  { id: "ORD-003", bakeryName: "Sweet Dreams", total: 320, delivery: 32, bastiAmount: 64, bakeryAmount: 224, addonValue: 45, date: "2026-05-04" },
  { id: "ORD-004", bakeryName: "Bakery Bites", total: 150, delivery: 15, bastiAmount: 30, bakeryAmount: 105, addonValue: 20, date: "2026-05-05" },
  { id: "ORD-005", bakeryName: "Cake Palace", total: 420, delivery: 42, bastiAmount: 84, bakeryAmount: 294, addonValue: 60, date: "2026-05-06" },
  { id: "ORD-006", bakeryName: "The Sugar Lab", total: 200, delivery: 20, bastiAmount: 40, bakeryAmount: 140, addonValue: 0, date: "2026-05-07" },
  { id: "ORD-007", bakeryName: "Bakery Bites", total: 350, delivery: 35, bastiAmount: 70, bakeryAmount: 245, addonValue: 35, date: "2026-05-08" },
  { id: "ORD-008", bakeryName: "Sweet Dreams", total: 190, delivery: 19, bastiAmount: 38, bakeryAmount: 133, addonValue: 0, date: "2026-05-09" },
  { id: "ORD-009", bakeryName: "The Sugar Lab", total: 280, delivery: 28, bastiAmount: 56, bakeryAmount: 196, addonValue: 25, date: "2026-05-10" },
  { id: "ORD-010", bakeryName: "Cake Palace", total: 110, delivery: 11, bastiAmount: 22, bakeryAmount: 77, addonValue: 15, date: "2026-05-11" },
  { id: "ORD-011", bakeryName: "Sweet Dreams", total: 380, delivery: 38, bastiAmount: 76, bakeryAmount: 266, addonValue: 50, date: "2026-05-12" },
  { id: "ORD-012", bakeryName: "Bakery Bites", total: 220, delivery: 22, bastiAmount: 44, bakeryAmount: 154, addonValue: 10, date: "2026-05-13" },
  { id: "ORD-013", bakeryName: "The Sugar Lab", total: 310, delivery: 31, bastiAmount: 62, bakeryAmount: 217, addonValue: 0, date: "2026-05-14" },
  { id: "ORD-014", bakeryName: "Cake Palace", total: 95, delivery: 10, bastiAmount: 19, bakeryAmount: 66, addonValue: 5, date: "2026-05-15" },
  { id: "ORD-015", bakeryName: "Sweet Dreams", total: 445, delivery: 45, bastiAmount: 89, bakeryAmount: 311, addonValue: 70, date: "2026-05-16" },
  { id: "ORD-016", bakeryName: "Bakery Bites", total: 175, delivery: 18, bastiAmount: 35, bakeryAmount: 122, addonValue: 0, date: "2026-05-17" },
  { id: "ORD-017", bakeryName: "The Sugar Lab", total: 260, delivery: 26, bastiAmount: 52, bakeryAmount: 182, addonValue: 30, date: "2026-05-18" },
  { id: "ORD-018", bakeryName: "Cake Palace", total: 340, delivery: 34, bastiAmount: 68, bakeryAmount: 238, addonValue: 40, date: "2026-05-19" },
  { id: "ORD-019", bakeryName: "Sweet Dreams", total: 130, delivery: 13, bastiAmount: 26, bakeryAmount: 91, addonValue: 0, date: "2026-05-20" },
  { id: "ORD-020", bakeryName: "Bakery Bites", total: 290, delivery: 29, bastiAmount: 58, bakeryAmount: 203, addonValue: 20, date: "2026-05-21" },
];

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

function OrderTableBody({ rows }: { rows: FinanceOrder[] }) {
  return (
    <>
      {rows.map((order) => (
        <TableRow key={order.id}>
          <TableCell className="font-mono font-medium">#{order.id}</TableCell>
          <TableCell>{order.bakeryName}</TableCell>
          <TableCell className="text-right tabular-nums">{fmt(order.total)}</TableCell>
          <TableCell className="text-right tabular-nums bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">{fmt(order.bastiAmount)}</TableCell>
          <TableCell className="text-right tabular-nums bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">{fmt(order.addonValue)}</TableCell>
          <TableCell className="text-right tabular-nums bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">{fmt(order.bakeryAmount)}</TableCell>
          <TableCell className="text-right tabular-nums bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400">{fmt(order.delivery)}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function FinanceOrdersPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const fetchBakeries = useBakeryStore((state) => state.fetchBakeries);
  const isCached = useBakeryStore((state) => state.isCached);

  const defaultRange = getDefaultRange();
  const [selectedBakery, setSelectedBakery] = useState("all");
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!isCached) fetchBakeries();
  }, [fetchBakeries, isCached]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [selectedBakery, startDate, endDate, pageSize]);

  const uniqueBakeries = useMemo(
    () => [...new Set(DUMMY_ORDERS.map((o) => o.bakeryName))].sort(),
    [],
  );

  const filtered = useMemo(() => {
    return DUMMY_ORDERS.filter((order) => {
      const matchesBakery =
        selectedBakery === "all" || order.bakeryName === selectedBakery;
      const matchesStart = !startDate || order.date >= startDate;
      const matchesEnd = !endDate || order.date <= endDate;
      return matchesBakery && matchesStart && matchesEnd;
    });
  }, [selectedBakery, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const sums = useMemo(
    () => ({
      total: filtered.reduce((a, o) => a + o.total, 0),
      delivery: filtered.reduce((a, o) => a + o.delivery, 0),
      bastiAmount: filtered.reduce((a, o) => a + o.bastiAmount, 0),
      bakeryAmount: filtered.reduce((a, o) => a + o.bakeryAmount, 0),
      addonValue: filtered.reduce((a, o) => a + o.addonValue, 0),
    }),
    [filtered],
  );

  const handleDownload = () => window.print();

  const tableHeaders = (
    <TableHeader>
      <TableRow>
        <TableHead className={isRTL ? "text-right" : "text-left"}>
          {t("finance.columns.orderId")}
        </TableHead>
        <TableHead className={isRTL ? "text-right" : "text-left"}>
          {t("finance.columns.bakery")}
        </TableHead>
        <TableHead className="text-right">{t("finance.columns.total")}</TableHead>
        <TableHead className="text-right bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
          {t("finance.columns.bastiAmount")}
        </TableHead>
        <TableHead className="text-right bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
          {t("finance.columns.addonValue")}
        </TableHead>
        <TableHead className="text-right bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
          {t("finance.columns.bakeryAmount")}
        </TableHead>
        <TableHead className="text-right bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
          {t("finance.columns.delivery")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );

  const sumFooter = filtered.length > 0 && (
    <TableFooter>
      <TableRow>
        <TableCell colSpan={2} className="font-semibold">
          {t("finance.sum")} ({filtered.length})
        </TableCell>
        <TableCell className="text-right font-semibold tabular-nums">{fmt(sums.total)}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">{fmt(sums.bastiAmount)}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">{fmt(sums.addonValue)}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">{fmt(sums.bakeryAmount)}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400">{fmt(sums.delivery)}</TableCell>
      </TableRow>
    </TableFooter>
  );

  return (
    <>
      <style>{`
        @media print {
          body > * { visibility: hidden; }
          .finance-print-area, .finance-print-area * { visibility: visible; }
          .finance-print-area { position: fixed; inset: 0; padding: 24px; background: white; }
        }
      `}</style>

      {/* Print-only area: full data, no pagination */}
      <div className="finance-print-area hidden print:block">
        <h1 className="text-xl font-bold mb-1">{t("finance.title")}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {startDate} — {endDate}
          {selectedBakery !== "all" ? `  ·  ${selectedBakery}` : ""}
        </p>
        <Table>
          {tableHeaders}
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                  {t("finance.noOrders")}
                </TableCell>
              </TableRow>
            ) : (
              <OrderTableBody rows={filtered} />
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
        <div className={`flex flex-wrap items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Select value={selectedBakery} onValueChange={setSelectedBakery}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("finance.allBakeries")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("finance.allBakeries")}</SelectItem>
              {uniqueBakeries.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
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
            className={`gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 ${isRTL ? "" : "ml-auto"}`}
          >
            <Download className="w-4 h-4" />
            {t("finance.download")}
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            {tableHeaders}
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {t("finance.noOrders")}
                  </TableCell>
                </TableRow>
              ) : (
                <OrderTableBody rows={paginated} />
              )}
            </TableBody>
            {sumFooter}
          </Table>
        </div>

        {/* Pagination controls */}
        {filtered.length > 0 && (
          <div className={`flex items-center justify-between text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="text-muted-foreground">
              {t("finance.showing")} {Math.min((safePage - 1) * pageSize + 1, filtered.length)}–{Math.min(safePage * pageSize, filtered.length)} {t("finance.of")} {filtered.length}
            </span>

            <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-muted-foreground">{t("finance.rowsPerPage")}</span>
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
                  disabled={safePage === 1}
                >
                  {isRTL ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
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
