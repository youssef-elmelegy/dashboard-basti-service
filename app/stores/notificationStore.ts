import { create } from "zustand";
import {
  notificationApi,
  type NotificationData,
  type ListNotificationsParams,
} from "@/lib/api/notification.api";

const PAGE_SIZE = 10;

export interface NotificationState {
  items: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  totalPages: number;

  fetchInitial: () => Promise<void>;
  fetchMore: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  refreshAll: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  prependFromPush: (notification: NotificationData) => void;
  reset: () => void;
}

function extractMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
  }
  return fallback;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  totalPages: 1,

  fetchInitial: async () => {
    set({ isLoading: true, error: null });
    try {
      const params: ListNotificationsParams = { page: 1, limit: PAGE_SIZE };
      const response = await notificationApi.list(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load notifications");
      }
      set({
        items: response.data.items,
        page: response.data.pagination.page,
        totalPages: response.data.pagination.totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: extractMessage(error, "Failed to load notifications"),
        isLoading: false,
      });
    }
  },

  fetchMore: async () => {
    const { page, totalPages, isLoadingMore } = get();
    if (isLoadingMore || page >= totalPages) return;

    set({ isLoadingMore: true });
    try {
      const response = await notificationApi.list({
        page: page + 1,
        limit: PAGE_SIZE,
      });
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load more");
      }
      set((state) => ({
        items: [...state.items, ...response.data!.items],
        page: response.data!.pagination.page,
        totalPages: response.data!.pagination.totalPages,
        isLoadingMore: false,
      }));
    } catch (error) {
      set({
        error: extractMessage(error, "Failed to load more"),
        isLoadingMore: false,
      });
    }
  },

  refreshUnreadCount: async () => {
    try {
      const response = await notificationApi.unreadCount();
      if (response.success && response.data) {
        set({ unreadCount: response.data.unreadCount });
      }
    } catch (error) {
      console.error("Failed to refresh unread count:", error);
    }
  },

  refreshAll: async () => {
    await Promise.all([get().fetchInitial(), get().refreshUnreadCount()]);
  },

  markAsRead: async (id: string) => {
    const target = get().items.find((n) => n.id === id);
    if (!target || target.isRead) return;

    set((state) => ({
      items: state.items.map((n) =>
        n.id === id
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
      await get().refreshAll();
    }
  },

  markAllAsRead: async () => {
    const previous = get().items;
    set((state) => ({
      items: state.items.map((n) =>
        n.isRead ? n : { ...n, isRead: true, readAt: new Date().toISOString() },
      ),
      unreadCount: 0,
    }));

    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      set({ items: previous });
      await get().refreshUnreadCount();
    }
  },

  remove: async (id: string) => {
    const previous = get().items;
    const target = previous.find((n) => n.id === id);

    set((state) => ({
      items: state.items.filter((n) => n.id !== id),
      unreadCount:
        target && !target.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
    }));

    try {
      await notificationApi.remove(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      set({ items: previous });
      await get().refreshUnreadCount();
    }
  },

  prependFromPush: (notification: NotificationData) => {
    set((state) => {
      if (state.items.some((n) => n.id === notification.id)) return state;
      return {
        items: [notification, ...state.items],
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      };
    });
  },

  reset: () => {
    set({
      items: [],
      unreadCount: 0,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      page: 1,
      totalPages: 1,
    });
  },
}));
