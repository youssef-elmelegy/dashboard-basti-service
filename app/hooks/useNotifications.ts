import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type NotificationType } from "@/lib/api/notification.api";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/auth.store";
import { playNotificationSound } from "@/lib/notification-sound";

function resolveNavigationPath(
  type: NotificationType | undefined,
  redirectId: string | null | undefined,
): string | null {
  if (!type) return null;

  // Bakery managers should land on the bakery-scoped views, never the
  // admin-only /orders/:id route (which the role guard blocks).
  const admin = useAuthStore.getState().admin;
  const isManager = admin?.role === "manager";
  const managerBakeryId = isManager ? admin?.bakeryId : undefined;

  switch (type) {
    case "new_order":
    case "order_update":
    case "order_status":
    case "order_cancelled_by_bakery":
      if (managerBakeryId) {
        return redirectId
          ? `/orders/bakery/${managerBakeryId}/orders/${redirectId}`
          : `/orders/bakery/${managerBakeryId}`;
      }
      return redirectId ? `/orders/${redirectId}` : "/orders";
    case "review":
      if (isManager) return "/bakery-reviews";
      // No admin-facing review screen exists yet, so there is nowhere
      // meaningful to send a non-manager. Returning null leaves the
      // notification non-clickable instead of navigating somewhere wrong.
      return null;
    case "coupon":
      return "/advertisement/coupons";
    case "offer":
      return "/advertisement/offers";
    case "promotion":
    case "system":
    default:
      return null;
  }
}

export function getNotificationNavigationPath(
  type: NotificationType | undefined,
  redirectId: string | null | undefined,
): string | null {
  return resolveNavigationPath(type, redirectId);
}

export function useNotifications() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const adminId = useAuthStore((state) => state.admin?.id);

  const refreshAll = useNotificationStore((state) => state.refreshAll);
  const refreshUnreadCount = useNotificationStore(
    (state) => state.refreshUnreadCount,
  );
  const reset = useNotificationStore((state) => state.reset);

  useEffect(() => {
    if (!isAuthenticated || !adminId) {
      reset();
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const init = async () => {
      try {
        await refreshAll();

        // Firebase is imported dynamically here (rather than at module
        // scope) to keep the SDK out of the entry chunk: this hook runs in
        // Navbar, which is part of the eagerly-loaded app shell, so a static
        // import would put ~200 KB of Firebase on the critical path for
        // every visitor including ones sitting on the login screen.
        const [{ subscribeToForegroundMessages }, { registerFcmWithBackend }] =
          await Promise.all([
            import("@/config/firebase"),
            import("@/lib/services/fcm.service"),
          ]);

        // Safety net: re-register on mount in case the auth store didn't
        // (e.g., persisted session restored before fcm.service hook-in).
        // The helper dedupes via its own cache so it's a no-op when
        // login already registered.
        void registerFcmWithBackend();

        unsubscribe = await subscribeToForegroundMessages((payload) => {
          console.log("[FCM] Foreground message received:", payload);
          if (!cancelled) {
            playNotificationSound();
            void refreshAll();
          }
        });
      } catch (error) {
        console.error("[FCM] Notification setup failed:", error);
      }
    };

    void init();

    const handleSwMessage = (event: MessageEvent) => {
      const messageType = event.data?.type;

      if (messageType === "NOTIFICATION_RECEIVED") {
        console.log("[FCM] Background message broadcast received");
        playNotificationSound();
        void refreshAll();
        return;
      }

      if (messageType === "NOTIFICATION_CLICK") {
        const data = event.data.data as Record<string, string> | undefined;
        const path = resolveNavigationPath(
          data?.type as NotificationType | undefined,
          data?.redirectId,
        );
        if (path) navigate(path);
        void refreshUnreadCount();
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSwMessage);
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleSwMessage,
        );
      }
    };
  }, [isAuthenticated, adminId, refreshAll, refreshUnreadCount, reset, navigate]);
}
