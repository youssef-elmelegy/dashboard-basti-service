import { useEffect, useState } from "react";
import type { UIEvent } from "react";
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
  Ban,
  Tag,
  Percent,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notificationStore";
import type {
  NotificationData,
  NotificationType,
} from "@/lib/api/notification.api";
import { getNotificationNavigationPath } from "@/hooks/useNotifications";

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  new_order: ShoppingBag,
  order_update: ShoppingBag,
  order_status: ShoppingBag,
  order_cancelled_by_bakery: Ban,
  review: Star,
  promotion: Megaphone,
  system: Info,
  offer: Percent,
  coupon: Tag,
};

const TYPE_TINTS: Record<NotificationType, string> = {
  new_order: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  order_update: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  order_status: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  order_cancelled_by_bakery: "bg-red-500/10 text-red-600 dark:text-red-400",
  review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  promotion: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  system: "bg-muted text-muted-foreground",
  offer: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  coupon: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

function formatBadge(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
  onNavigate: (notification: NotificationData) => void;
}

function NotificationItem({
  notification,
  onMarkRead,
  onRemove,
  onNavigate,
}: NotificationItemProps) {
  const { t, i18n } = useTranslation();
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const tint = TYPE_TINTS[notification.type] ?? TYPE_TINTS.system;
  const locale = i18n.language === "ar" ? arLocale : enUS;

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
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(notification)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(notification);
        }
      }}
      className={cn(
        "group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/60 focus:outline-none focus:bg-accent/60 border-b border-border/40",
        !notification.isRead && "bg-accent/30",
      )}
    >
      <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", tint)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "text-sm leading-tight line-clamp-1 flex-1",
              !notification.isRead ? "font-semibold" : "font-medium",
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span
              className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"
              aria-label={t("notifications.unread")}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.body}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          <div className="ms-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {!notification.isRead && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title={t("notifications.markAsRead")}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              title={t("common.delete")}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(notification.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = useNotificationStore((state) => state.items);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const isLoadingMore = useNotificationStore((state) => state.isLoadingMore);
  const page = useNotificationStore((state) => state.page);
  const totalPages = useNotificationStore((state) => state.totalPages);
  const error = useNotificationStore((state) => state.error);
  const fetchInitial = useNotificationStore((state) => state.fetchInitial);
  const fetchMore = useNotificationStore((state) => state.fetchMore);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const remove = useNotificationStore((state) => state.remove);

  useEffect(() => {
    if (open) void fetchInitial();
  }, [open, fetchInitial]);

  const hasMore = page < totalPages;

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore) return;
    const target = event.currentTarget;
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceFromBottom < 120) {
      void fetchMore();
    }
  };

  const handleNavigate = (notification: NotificationData) => {
    const path = getNotificationNavigationPath(
      notification.type,
      notification.redirectId,
    );
    if (path) {
      setOpen(false);
      navigate(path);
    }
  };

  const isEmpty = !isLoading && items.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-accent"
          aria-label={t("notifications.title")}
        >
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -end-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full",
                "bg-red-500 text-white text-[10px] font-semibold",
                "flex items-center justify-center leading-none",
              )}
            >
              {formatBadge(unreadCount)}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-88 p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">
              {t("notifications.title")}
            </h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => void markAllAsRead()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        <div
          onScroll={handleScroll}
          className="max-h-104 overflow-y-auto custom-scrollbar"
        >
          {isLoading && items.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 gap-2">
              <p className="text-sm text-destructive text-center">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchInitial()}
              >
                {t("common.retry")}
              </Button>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 gap-2 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t("notifications.empty")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => void markAsRead(id)}
                  onRemove={(id) => void remove(id)}
                  onNavigate={handleNavigate}
                />
              ))}

              {hasMore && (
                <div className="flex items-center justify-center py-3">
                  {isLoadingMore && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full rounded-none h-10 text-xs font-medium"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            {t("notifications.viewAll")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
