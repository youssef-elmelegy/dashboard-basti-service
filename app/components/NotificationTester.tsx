import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  notificationApi,
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/lib/api/notification.api";

type SendMode = "user" | "admin" | "broadcast";

const DEFAULT_TYPE: NotificationType = "system";

export function NotificationTester() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SendMode>("user");
  const [recipientId, setRecipientId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [type, setType] = useState<NotificationType>(DEFAULT_TYPE);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [redirectId, setRedirectId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  const reset = () => {
    setRecipientId("");
    setRegionId("");
    setTitle("");
    setBody("");
    setRedirectId("");
    setStatus(null);
  };

  const handleSend = async () => {
    setStatus(null);

    if (!title.trim() || !body.trim()) {
      setStatus({
        kind: "error",
        message: t("notifications.tester.errorGeneric"),
      });
      return;
    }
    if (mode !== "broadcast" && !recipientId.trim()) {
      setStatus({
        kind: "error",
        message: t("notifications.tester.errorGeneric"),
      });
      return;
    }

    const data: Record<string, string> = {};
    if (regionId.trim()) data.regionId = regionId.trim();

    setIsSending(true);
    try {
      if (mode === "broadcast") {
        const response = await notificationApi.sendBroadcast({
          title: title.trim(),
          body: body.trim(),
          type,
          redirectId: redirectId.trim() || undefined,
          data: Object.keys(data).length > 0 ? data : undefined,
        });
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed");
        }
        setStatus({
          kind: "success",
          message: t("notifications.tester.successBroadcast", {
            count: response.data.pushedCount,
          }),
        });
      } else {
        const response = await notificationApi.send({
          title: title.trim(),
          body: body.trim(),
          type,
          recipientType: mode,
          recipientId: recipientId.trim(),
          redirectId: redirectId.trim() || undefined,
          data: Object.keys(data).length > 0 ? data : undefined,
        });
        if (!response.success) {
          throw new Error(response.message || "Failed");
        }
        setStatus({
          kind: "success",
          message: t("notifications.tester.successOne"),
        });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("notifications.tester.errorGeneric");
      setStatus({ kind: "error", message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <Send className="h-4 w-4" />
          {t("notifications.tester.open")}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto px-4"
      >
        <SheetHeader className="px-0">
          <SheetTitle>{t("notifications.tester.title")}</SheetTitle>
          <SheetDescription>
            {t("notifications.tester.description")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nt-mode">{t("notifications.tester.mode")}</Label>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as SendMode)}
            >
              <SelectTrigger id="nt-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  {t("notifications.tester.modeUser")}
                </SelectItem>
                <SelectItem value="admin">
                  {t("notifications.tester.modeAdmin")}
                </SelectItem>
                <SelectItem value="broadcast">
                  {t("notifications.tester.modeBroadcast")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode !== "broadcast" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nt-recipient">
                {t("notifications.tester.recipientId")}
              </Label>
              <Input
                id="nt-recipient"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder={t(
                  "notifications.tester.recipientIdPlaceholder",
                )}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nt-type">{t("notifications.tester.type")}</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as NotificationType)}
            >
              <SelectTrigger id="nt-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((typeOption) => (
                  <SelectItem key={typeOption} value={typeOption}>
                    {t(`notifications.types.${typeOption}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nt-title">
              {t("notifications.tester.titleField")}
            </Label>
            <Input
              id="nt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nt-body">
              {t("notifications.tester.bodyField")}
            </Label>
            <Textarea
              id="nt-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nt-region">
              {t("notifications.tester.regionId")}
            </Label>
            <Input
              id="nt-region"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              placeholder={t("notifications.tester.regionIdPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nt-redirect">
              {t("notifications.tester.redirectId")}
            </Label>
            <Input
              id="nt-redirect"
              value={redirectId}
              onChange={(e) => setRedirectId(e.target.value)}
              placeholder={t("notifications.tester.redirectIdPlaceholder")}
            />
          </div>

          {status && (
            <p
              className={
                status.kind === "success"
                  ? "text-sm text-emerald-600 dark:text-emerald-400"
                  : "text-sm text-destructive"
              }
            >
              {status.message}
            </p>
          )}

          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSending
              ? t("notifications.tester.sending")
              : t("notifications.tester.send")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
