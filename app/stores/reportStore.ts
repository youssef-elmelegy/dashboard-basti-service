import { create } from "zustand";
import {
  driverService,
  type ReportListItem,
  type PaginationMeta,
  type ListReportsParams,
} from "@/lib/services/driver.service";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const obj = error as { message?: unknown; details?: unknown };
    if (Array.isArray(obj.details) && obj.details.length > 0) {
      return obj.details.filter((d) => typeof d === "string").join("; ");
    }
    if (typeof obj.details === "string" && obj.details.length > 0) {
      return obj.details;
    }
    if (typeof obj.message === "string" && obj.message.length > 0) {
      return obj.message;
    }
  }
  if (typeof error === "string" && error.length > 0) return error;
  return fallback;
}

const emptyPagination: PaginationMeta = {
  total: 0,
  totalPages: 1,
  page: 1,
  limit: 15,
};

interface ReportStore {
  reports: ReportListItem[];
  pagination: PaginationMeta;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  /**
   * Fetch a page of all driver reports. Use mode "replace" for the first page
   * and "append" to add subsequent pages (load-more).
   */
  fetchReports: (
    params?: ListReportsParams,
    mode?: "replace" | "append",
  ) => Promise<void>;
  reset: () => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  reports: [],
  pagination: emptyPagination,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  fetchReports: async (params, mode = "replace") => {
    set(
      mode === "replace"
        ? { isLoading: true, error: null }
        : { isLoadingMore: true, error: null },
    );
    try {
      const data = await driverService.getAllReports(params);
      set((state) => ({
        reports:
          mode === "replace" ? data.items : [...state.reports, ...data.items],
        pagination: data.pagination,
        isLoading: false,
        isLoadingMore: false,
      }));
    } catch (error) {
      set({
        error: extractErrorMessage(error, "Failed to fetch reports"),
        isLoading: false,
        isLoadingMore: false,
      });
    }
  },

  reset: () =>
    set({
      reports: [],
      pagination: emptyPagination,
      isLoading: false,
      isLoadingMore: false,
      error: null,
    }),
}));
