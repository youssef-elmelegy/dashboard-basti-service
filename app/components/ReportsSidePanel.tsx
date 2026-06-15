import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { Flag, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReportStore } from "@/stores/reportStore";
import { type ReportListItem } from "@/lib/services/driver.service";

const PAGE_SIZE = 15;

export interface ReportsSidePanelProps {
  className?: string;
}

/**
 * Home-page side panel listing every driver report (read-only).
 * Has its own internal scroll + "load more" so it doesn't drive the page scroll.
 */
export function ReportsSidePanel({ className }: ReportsSidePanelProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? arLocale : enUS;

  const items = useReportStore((s) => s.reports);
  const pagination = useReportStore((s) => s.pagination);
  const isInitialLoading = useReportStore((s) => s.isLoading);
  const isLoadingMore = useReportStore((s) => s.isLoadingMore);
  const error = useReportStore((s) => s.error);
  const fetchReports = useReportStore((s) => s.fetchReports);
  const reset = useReportStore((s) => s.reset);

  const total = pagination.total;
  const hasMore = pagination.page < pagination.totalPages;

  useEffect(() => {
    void fetchReports({ page: 1, limit: PAGE_SIZE }, "replace");
    return () => reset();
  }, [fetchReports, reset]);

  const formatDate = (value: string) => {
    try {
      return formatDistanceToNow(new Date(value), { addSuffix: true, locale });
    } catch {
      return "";
    }
  };

  const reporterName = (report: ReportListItem) =>
    [report.user.firstName, report.user.lastName].filter(Boolean).join(" ") ||
    report.user.phoneNumber ||
    t("reportsPanel.unknownReporter");

  return (
    <aside
      className={cn(
        "flex flex-col rounded-lg border bg-card overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3 shrink-0">
        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <h2 className="text-sm font-semibold flex-1">
          {t("reportsPanel.title")}
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {total}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isInitialLoading && items.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void fetchReports({ page: 1, limit: PAGE_SIZE }, "replace")
              }
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
            <Flag className="h-9 w-9 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t("reportsPanel.empty")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {items.map((report) => (
              <div key={report.id} className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">
                    {reporterName(report)}
                  </p>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                    {formatDate(report.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("reportsPanel.reportedDriver", {
                    driver:
                      report.driver.name ||
                      report.driver.phoneNumber ||
                      t("reportsPanel.unknownDriver"),
                  })}
                </p>
                <p className="text-sm text-foreground/90 break-words">
                  {report.reportBody}
                </p>
              </div>
            ))}

            {hasMore && (
              <div className="flex items-center justify-center p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  disabled={isLoadingMore}
                  onClick={() =>
                    void fetchReports(
                      { page: pagination.page + 1, limit: PAGE_SIZE },
                      "append",
                    )
                  }
                >
                  {isLoadingMore && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t("reportsPanel.loadMore")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
