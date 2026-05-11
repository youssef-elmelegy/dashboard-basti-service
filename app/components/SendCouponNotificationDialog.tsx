import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notificationApi } from "@/lib/api/notification.api";
import type { Coupon } from "@/lib/services/coupon.service";

interface SendCouponNotificationDialogProps {
  coupon: Coupon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildDefaultTitle(coupon: Coupon): string {
  return `New coupon: ${coupon.code}`;
}

function buildDefaultBody(coupon: Coupon): string {
  let discount: string;
  if (coupon.discountType === "free_shipping") {
    discount = "free shipping";
  } else if (coupon.discountType === "percentage") {
    discount = `${coupon.discountValue}% off`;
  } else {
    discount = `${coupon.discountValue} LYD off`;
  }

  let line = `Use code ${coupon.code} to get ${discount}`;
  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    if (!Number.isNaN(expiry.getTime())) {
      line += ` — valid until ${expiry.toLocaleDateString("en-US")}`;
    }
  }
  return `${line}.`;
}

export function SendCouponNotificationDialog({
  coupon,
  open,
  onOpenChange,
}: SendCouponNotificationDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  useEffect(() => {
    if (open && coupon) {
      setTitle(buildDefaultTitle(coupon));
      setBody(buildDefaultBody(coupon));
      setFeedback(null);
    }
  }, [open, coupon]);

  const handleSend = async () => {
    if (!coupon || !title.trim() || !body.trim()) return;
    setIsSending(true);
    setFeedback(null);

    try {
      const response = await notificationApi.sendBroadcast({
        title: title.trim(),
        body: body.trim(),
        type: "promotion",
        data: { couponCode: coupon.code, couponId: coupon.id },
      });

      if (response.success && response.data) {
        const { totalUsers, pushedCount, failedCount } = response.data;
        setFeedback({
          kind: "success",
          message: t("coupons.notification.sentSummary", {
            pushed: pushedCount,
            total: totalUsers,
            failed: failedCount,
          }),
        });
      } else {
        setFeedback({
          kind: "error",
          message:
            response.message ?? t("coupons.notification.failedToSend"),
        });
      }
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : t("coupons.notification.failedToSend");
      setFeedback({ kind: "error", message: errMsg });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto max-w-xl py-6">
        <SheetHeader>
          <SheetTitle>{t("coupons.notification.title")}</SheetTitle>
          <SheetDescription>
            {t("coupons.notification.description")}
          </SheetDescription>
        </SheetHeader>

        {coupon && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground">
                {t("coupons.code")}:{" "}
              </span>
              <span className="font-mono font-semibold">{coupon.code}</span>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notification-title">
                {t("coupons.notification.titleField")}
              </Label>
              <Input
                id="notification-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                disabled={isSending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notification-body">
                {t("coupons.notification.bodyField")}
              </Label>
              <Textarea
                id="notification-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                disabled={isSending}
              />
            </div>

            {feedback && (
              <div
                className={`rounded-md border p-3 text-sm ${
                  feedback.kind === "success"
                    ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300"
                    : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSending}
              >
                {feedback?.kind === "success"
                  ? t("common.close")
                  : t("common.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleSend}
                disabled={isSending || !title.trim() || !body.trim()}
                className="gap-2"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSending
                  ? t("coupons.notification.sending")
                  : t("coupons.notification.send")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
