import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Megaphone,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";

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
import { cn } from "@/lib/utils";
import {
  notificationApi,
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/lib/api/notification.api";
import { useRegionStore } from "@/stores/regionStore";

type SendMode = "user" | "admin" | "broadcast";

const DEFAULT_TYPE: NotificationType = "system";

const MODE_OPTIONS: {
  value: SendMode;
  labelKey: string;
  icon: typeof User;
}[] = [
  { value: "broadcast", labelKey: "notifications.tester.modeBroadcast", icon: Megaphone },
  { value: "user", labelKey: "notifications.tester.modeUser", icon: User },
  { value: "admin", labelKey: "notifications.tester.modeAdmin", icon: ShieldCheck },
];

const REGION_NONE = "__none";

export function NotificationTester() {
  const { t } = useTranslation();
  const regions = useRegionStore((state) => state.regions);
  const fetchRegions = useRegionStore((state) => state.fetchRegions);
  const [mode, setMode] = useState<SendMode>("broadcast");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [regionId, setRegionId] = useState<string>(REGION_NONE);
  const [type, setType] = useState<NotificationType>(DEFAULT_TYPE);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [redirectId, setRedirectId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "success"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  useEffect(() => {
    void fetchRegions().catch(() => {});
  }, [fetchRegions]);

  const resetAfterSend = () => {
    setTitle("");
    setBody("");
    setRedirectId("");
    setRegionId(REGION_NONE);
  };

  const handleSend = async () => {
    setStatus(null);

    if (!title.trim() || !body.trim()) {
      setStatus({
        kind: "error",
        message: t("notifications.tester.errorRequired"),
      });
      return;
    }
    if (mode !== "broadcast" && !recipientEmail.trim()) {
      setStatus({
        kind: "error",
        message: t("notifications.tester.errorRecipient"),
      });
      return;
    }

    const data: Record<string, string> = {};
    if (regionId && regionId !== REGION_NONE) data.regionId = regionId;

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
          recipientEmail: recipientEmail.trim(),
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
      resetAfterSend();
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label className="text-sm">{t("notifications.tester.mode")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {MODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMode(option.value);
                  setStatus(null);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-md border p-3 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-center leading-tight">
                  {t(option.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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

        {mode !== "broadcast" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nt-recipient">
              {mode === "user"
                ? t("notifications.tester.recipientEmailUser")
                : t("notifications.tester.recipientEmailAdmin")}
            </Label>
            <Input
              id="nt-recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder={t("notifications.tester.recipientEmailPlaceholder")}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nt-title">
          {t("notifications.tester.titleField")}
        </Label>
        <Input
          id="nt-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("notifications.tester.titlePlaceholder")}
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
          placeholder={t("notifications.tester.bodyPlaceholder")}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-dashed bg-muted/30 p-3">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <span>{t("notifications.tester.advanced")}</span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {showAdvanced && (
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nt-region">
                {t("notifications.tester.regionId")}
              </Label>
              <Select value={regionId} onValueChange={setRegionId}>
                <SelectTrigger id="nt-region">
                  <SelectValue
                    placeholder={t("notifications.tester.regionPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={REGION_NONE}>
                    {t("notifications.tester.regionNone")}
                  </SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
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

      <div className="flex justify-end">
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
            : mode === "broadcast"
              ? t("notifications.tester.sendBroadcast")
              : t("notifications.tester.send")}
        </Button>
      </div>
    </div>
  );
}
