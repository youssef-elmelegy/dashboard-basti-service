import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  ShoppingBag,
  Star,
  Megaphone,
  Info,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  type NotificationData,
  type NotificationType,
} from "@/lib/api/notification.api";
import { useNotificationStore } from "@/stores/notificationStore";
import { getNotificationNavigationPath } from "@/hooks/useNotifications";

const PAGE_SIZE = 20;

type ReadFilter = "all" | "unread" | "read";
type TypeFilter = "all" | NotificationType;

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  new_order: ShoppingBag,
  order_update: ShoppingBag,
  order_status: ShoppingBag,
  review: Star,
  promotion: Megaphone,
  system: Info,
};

const TYPE_TINTS: Record<NotificationType, string> = {
  new_order: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  order_update: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  order_status: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  promotion: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  system: "bg-muted text-muted-foreground",
};

export default function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";
  const locale = isRTL ? arLocale : enUS;

  const refreshUnreadCount = useNotificationStore(
    (state) => state.refreshUnreadCount,
  );

  const [items, setItems] = useState<NotificationData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (nextPage: number, mode: "replace" | "append") => {
      if (mode === "replace") {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const response = await notificationApi.list({
          page: nextPage,
          limit: PAGE_SIZE,
          isRead:
            readFilter === "unread"
              ? false
              : readFilter === "read"
                ? true
                : undefined,
          type: typeFilter === "all" ? undefined : typeFilter,
        });
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to load");
        }

        setItems((prev) =>
          mode === "replace"
            ? response.data!.items
            : [...prev, ...response.data!.items],
        );
        setPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load notifications";
        setError(message);
      } finally {
        if (mode === "replace") {
          setIsInitialLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [readFilter, typeFilter],
  );

  // Reset and load first page whenever filters change
  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotalPages(1);
    void fetchPage(1, "replace");
  }, [readFilter, typeFilter, fetchPage]);

  const hasMore = page < totalPages;

  // Infinite scroll: listen on the actual scrolling element (the layout's <main>)
  useEffect(() => {
    if (!hasMore || isInitialLoading) return;

    const scrollEl = document.querySelector("main");
    const target: HTMLElement | Window = scrollEl ?? window;

    const handleScroll = () => {
      if (isLoadingMore) return;
      let distanceFromBottom: number;
      if (scrollEl) {
        distanceFromBottom =
          scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      } else {
        distanceFromBottom =
          document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight;
      }
      if (distanceFromBottom < 200) {
        void fetchPage(page + 1, "append");
      }
    };

    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [hasMore, isInitialLoading, isLoadingMore, page, fetchPage]);

  const handleMarkAsRead = async (id: string) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;

    setItems((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n,
      ),
    );

    try {
      await notificationApi.markAsRead(id);
      void refreshUnreadCount();
    } catch (err) {
      console.error("Failed to mark as read:", err);
      void fetchPage(1, "replace");
    }
  };

  const handleMarkAllAsRead = async () => {
    const previous = items;
    setItems((prev) =>
      prev.map((n) =>
        n.isRead ? n : { ...n, isRead: true, readAt: new Date().toISOString() },
      ),
    );

    try {
      await notificationApi.markAllAsRead();
      void refreshUnreadCount();
      if (readFilter === "unread") void fetchPage(1, "replace");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setItems(previous);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = items;
    const target = previous.find((n) => n.id === id);
    setItems((prev) => prev.filter((n) => n.id !== id));

    try {
      await notificationApi.remove(id);
      if (target && !target.isRead) void refreshUnreadCount();
    } catch (err) {
      console.error("Failed to delete notification:", err);
      setItems(previous);
    }
  };

  const handleNavigate = (notification: NotificationData) => {
    const path = getNotificationNavigationPath(
      notification.type,
      notification.redirectId,
    );
    if (path) navigate(path);
  };

  const hasUnread = useMemo(() => items.some((n) => !n.isRead), [items]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("notifications.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("notifications.totalCount", { count: total })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={readFilter}
            onValueChange={(value) => setReadFilter(value as ReadFilter)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("notifications.filter.all")}
              </SelectItem>
              <SelectItem value="unread">
                {t("notifications.filter.unread")}
              </SelectItem>
              <SelectItem value="read">
                {t("notifications.filter.read")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TypeFilter)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("notifications.types.all")}
              </SelectItem>
              {NOTIFICATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`notifications.types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleMarkAllAsRead()}
            disabled={!hasUnread}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            {t("notifications.markAllRead")}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {isInitialLoading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchPage(1, "replace")}
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 gap-3 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t("notifications.empty")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {items.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] ?? Bell;
              const tint =
                TYPE_TINTS[notification.type] ?? TYPE_TINTS.system;
              const targetPath = getNotificationNavigationPath(
                notification.type,
                notification.redirectId,
              );

              const timeAgo = (() => {
                try {
                  return formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale,
                  });
                } catch {
                  return "";
                }
              })();

              return (
                <div
                  key={notification.id}
                  role={targetPath ? "button" : undefined}
                  tabIndex={targetPath ? 0 : undefined}
                  onClick={() => handleNavigate(notification)}
                  onKeyDown={(e) => {
                    if (
                      targetPath &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      handleNavigate(notification);
                    }
                  }}
                  className={cn(
                    "flex gap-4 px-5 py-4 transition-colors",
                    !notification.isRead && "bg-accent/30",
                    targetPath &&
                      "cursor-pointer hover:bg-accent/60 focus:bg-accent/60 focus:outline-none",
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      tint,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p
                        className={cn(
                          "text-sm flex-1",
                          !notification.isRead ? "font-semibold" : "font-medium",
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {timeAgo}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {t(`notifications.types.${notification.type}`)}
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={t("notifications.markAsRead")}
                        onClick={() => void handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title={t("common.delete")}
                      onClick={() => void handleDelete(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div className="flex items-center justify-center py-6">
                {isLoadingMore && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
