import { apiClient, type ApiResponse } from "../api-client";

export const NOTIFICATION_TYPES = [
  "order_update",
  "order_status",
  "order_cancelled_by_bakery",
  "promotion",
  "system",
  "review",
  "new_order",
  "offer",
  "coupon",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationRecipientType = "user" | "admin";

export const BROADCAST_AUDIENCES = [
  "all",
  "users",
  "admins",
  "bakery_owners",
  "drivers",
] as const;

export type BroadcastAudience = (typeof BROADCAST_AUDIENCES)[number];

export interface SendNotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  recipientType: NotificationRecipientType;
  recipientEmail: string;
  redirectId?: string;
  data?: Record<string, string>;
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  userId: string | null;
  adminId: string | null;
  redirectId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPagination {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface PaginatedNotifications {
  items: NotificationData[];
  pagination: NotificationPagination;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
  /** When true, request only notifications that need admin action. */
  actionRequired?: boolean;
}

export interface BroadcastNotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  audience?: BroadcastAudience;
  redirectId?: string;
  data?: Record<string, string>;
}

export interface BroadcastNotificationResult {
  totalUsers: number;
  pushedCount: number;
  failedCount: number;
}

function buildQuery(params: ListNotificationsParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.isRead !== undefined) search.set("isRead", String(params.isRead));
  if (params.type !== undefined) search.set("type", params.type);
  if (params.actionRequired) search.set("actionRequired", "true");
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

class NotificationApi {
  registerToken(fcmToken: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>("/notifications/register-token", {
      fcmToken,
    });
  }

  clearToken(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      "/notifications/register-token",
    );
  }

  list(
    params: ListNotificationsParams = {},
  ): Promise<ApiResponse<PaginatedNotifications>> {
    return apiClient.get<PaginatedNotifications>(
      `/notifications${buildQuery(params)}`,
    );
  }

  unreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return apiClient.get<{ unreadCount: number }>(
      "/notifications/unread-count",
    );
  }

  markAsRead(id: string): Promise<ApiResponse<NotificationData>> {
    return apiClient.patch<NotificationData>(
      `/notifications/${id}/read`,
      {},
    );
  }

  markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>(
      "/notifications/read-all",
      {},
    );
  }

  remove(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/notifications/${id}`);
  }

  sendBroadcast(
    payload: BroadcastNotificationPayload,
  ): Promise<ApiResponse<BroadcastNotificationResult>> {
    return apiClient.post<BroadcastNotificationResult>(
      "/notifications/send-broadcast",
      payload,
    );
  }

  send(payload: SendNotificationPayload): Promise<ApiResponse<NotificationData>> {
    return apiClient.post<NotificationData>("/notifications/send", payload);
  }
}

export const notificationApi = new NotificationApi();
