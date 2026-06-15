import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowRightLeft, RotateCcw, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  orderApi,
  type AvailableBakery,
  type BakeryStockIssue,
} from "@/lib/services/order.service";
import type { ApiError } from "@/lib/api-client";

/** The backend blocks a non-forced reassign with this error code when the target
 *  bakery can't fully stock the order; the issue list rides along in `data.data`. */
function asStockIssueError(
  err: unknown,
): { message: string; issues: BakeryStockIssue[] } | null {
  if (typeof err !== "object" || err === null) return null;
  const apiErr = err as ApiError;
  if (apiErr.error !== "BAKERY_STOCK_ISSUE") return null;
  const body = apiErr.data as
    | { data?: { issues?: BakeryStockIssue[] } }
    | undefined;
  return {
    message: apiErr.message || "",
    issues: body?.data?.issues ?? [],
  };
}

interface ReassignOrderDialogProps {
  orderId: string;
  referenceNumber?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful unassign/reassign so the page can refetch. */
  onActionDone: () => void;
}

/**
 * Admin action sheet for an order already handed to a bakery. Offers two moves:
 *  1. Return the order to the admin (unassign) — backend resets it to pending,
 *     clears the bakery + assigning date, and notifies the bakery.
 *  2. Reassign it directly to another available bakery in the same region/type.
 * Works while the order is pending / confirmed / preparing.
 */
export default function ReassignOrderDialog({
  orderId,
  referenceNumber,
  open,
  onOpenChange,
  onActionDone,
}: ReassignOrderDialogProps) {
  const { t } = useTranslation();

  const [bakeries, setBakeries] = useState<AvailableBakery[]>([]);
  const [loadingBakeries, setLoadingBakeries] = useState(false);
  const [selectedBakeryId, setSelectedBakeryId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState<null | "return" | "reassign">(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  // Set when a normal reassign is blocked because the target bakery can't fully
  // stock the order — drives the "reassign anyway" confirmation.
  const [stockIssue, setStockIssue] = useState<{
    message: string;
    issues: BakeryStockIssue[];
  } | null>(null);

  const currentBakery = bakeries.find((b) => b.isCurrent);

  // Reset transient state and load the candidate bakeries each time it opens.
  useEffect(() => {
    if (!open) return;
    setSelectedBakeryId("");
    setReason("");
    setError(null);
    setStockIssue(null);

    let cancelled = false;
    const load = async () => {
      setLoadingBakeries(true);
      try {
        const res = await orderApi.getAvailableBakeries(orderId);
        if (cancelled) return;
        if (res.success && res.data) {
          setBakeries(res.data);
        } else {
          setError(res.message || t("reassignOrder.loadError"));
          setBakeries([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("reassignOrder.loadError"),
          );
          setBakeries([]);
        }
      } finally {
        if (!cancelled) setLoadingBakeries(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, orderId, t]);

  const handleReturnToAdmin = async () => {
    setSubmitting("return");
    setError(null);
    try {
      const res = await orderApi.unassignFromBakery(
        orderId,
        reason.trim() || undefined,
      );
      if (!res.success) {
        setError(res.message || t("reassignOrder.returnError"));
        return;
      }
      onActionDone();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("reassignOrder.returnError"),
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleReassign = async (force = false) => {
    if (!selectedBakeryId) return;
    setSubmitting("reassign");
    setError(null);
    try {
      const res = await orderApi.assignToBakery(orderId, selectedBakeryId, force);
      if (!res.success) {
        setError(res.message || t("reassignOrder.reassignError"));
        return;
      }
      onActionDone();
      onOpenChange(false);
    } catch (err) {
      // A blocked reassign (target bakery can't fully stock the order) is not a
      // hard error — surface the items and let the admin force the move.
      const issue = asStockIssueError(err);
      if (issue && !force) {
        setStockIssue(issue);
        return;
      }
      setError(
        err instanceof Error ? err.message : t("reassignOrder.reassignError"),
      );
    } finally {
      setSubmitting(null);
    }
  };

  const isBusy = submitting !== null;
  // Other bakeries the order can move to (exclude the current one).
  const targetBakeries = bakeries.filter((b) => !b.isCurrent);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 sm:max-w-md border-s-4 border-s-red-500">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            {t("reassignOrder.title")}
            {referenceNumber ? ` · #${referenceNumber}` : ""}
          </SheetTitle>
          <SheetDescription>
            {currentBakery
              ? t("reassignOrder.currentlyWith", { bakery: currentBakery.name })
              : t("reassignOrder.description")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {error && (
            <p className="text-sm text-destructive border border-destructive/30 rounded-md p-2 bg-destructive/5">
              {error}
            </p>
          )}

          {/* Option 1 — Reassign to another bakery */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">
                {t("reassignOrder.reassignTitle")}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("reassignOrder.reassignDesc")}
            </p>

            {loadingBakeries ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : targetBakeries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {t("reassignOrder.noBakeries")}
              </p>
            ) : (
              <>
                <Select
                  value={selectedBakeryId}
                  onValueChange={(value) => {
                    setSelectedBakeryId(value);
                    setStockIssue(null);
                  }}
                  disabled={isBusy}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("reassignOrder.selectBakery")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {targetBakeries.map((bakery) => (
                      <SelectItem key={bakery.id} value={bakery.id}>
                        {bakery.name} —{" "}
                        {t("reassignOrder.capacityLabel", {
                          available: bakery.availableCapacity,
                          capacity: bakery.capacity,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {stockIssue ? (
                  <div className="rounded-md border border-amber-400 bg-amber-50 p-3 space-y-2">
                    <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {stockIssue.message || t("reassignOrder.stockIssueTitle")}
                    </p>
                    {stockIssue.issues.length > 0 && (
                      <ul className="text-xs text-amber-800 list-disc ps-5 space-y-0.5">
                        {stockIssue.issues.map((issue, i) => (
                          <li key={i}>
                            {issue.name} —{" "}
                            {issue.reason === "not_stocked"
                              ? t("reassignOrder.notStocked")
                              : t("reassignOrder.insufficient", {
                                  available: issue.available,
                                  requested: issue.requested,
                                })}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 bg-red-600 hover:bg-red-700"
                        disabled={isBusy}
                        onClick={() => handleReassign(true)}
                      >
                        {submitting === "reassign" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4" />
                        )}
                        {t("reassignOrder.forceReassign")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => setStockIssue(null)}
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    className="w-full gap-2"
                    disabled={!selectedBakeryId || isBusy}
                    onClick={() => handleReassign(false)}
                  >
                    {submitting === "reassign" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4" />
                    )}
                    {t("reassignOrder.reassignAction")}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Option 2 — Return to admin orders list */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-semibold">
                {t("reassignOrder.returnTitle")}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("reassignOrder.returnDesc")}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reassign-reason" className="text-xs">
                {t("reassignOrder.reasonLabel")}
              </Label>
              <Textarea
                id="reassign-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("reassignOrder.reasonPlaceholder")}
                rows={2}
                disabled={isBusy}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              disabled={isBusy}
              onClick={handleReturnToAdmin}
            >
              {submitting === "return" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              {t("reassignOrder.returnAction")}
            </Button>
          </div>
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            {t("common.close")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
