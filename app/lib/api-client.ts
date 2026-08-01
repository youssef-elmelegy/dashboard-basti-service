import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";
import { env } from "@/config/env";
import { getCurrentLanguage } from "@/lib/language-header";

export interface ApiResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ApiError {
  code: number;
  message: string;
  details?: string[] | string;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Extracts a human-readable message from a thrown value.
 *
 * The response interceptor rejects with a plain `ApiError` object (not an
 * `Error` instance), so callers can't rely on `error instanceof Error`. This
 * pulls the real backend message — preferring the granular validation
 * `details` list, then the normalized `message` — falling back to `fallback`.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; details?: unknown };
    if (Array.isArray(e.details)) {
      const joined = e.details
        .filter((d): d is string => typeof d === "string" && d.trim() !== "")
        .join("; ");
      if (joined) return joined;
    } else if (typeof e.details === "string" && e.details.trim() !== "") {
      return e.details;
    }
    if (typeof e.message === "string" && e.message.trim() !== "") {
      return e.message;
    }
  }
  return fallback;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    // Request interceptor: attach Accept-Language and log
    this.axiosInstance.interceptors.request.use((config) => {
      config.headers.set("Accept-Language", getCurrentLanguage());
      console.debug(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        config.data,
      );
      return config;
    });

    // Response interceptor for error handling and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.debug(
          `[API Response] ${response.status} ${response.config.url}`,
          response.data,
        );
        return response.data;
      },
      async (error: AxiosError<Record<string, unknown>>) => {
        const originalRequest = error.config as unknown as Record<
          string,
          unknown
        >;
        const data = error.response?.data as
          | Record<string, unknown>
          | undefined;

        // Endpoints that should NOT trigger a token refresh on 401.
        // check-auth IS included in refresh-on-401 because its whole purpose is
        // "am I still authenticated — and if my access token expired, refresh
        // it transparently using the refresh-token cookie."
        const noRefreshEndpoints = [
          "/admin-auth/refresh",
          "/admin-auth/login",
        ];
        const isNoRefreshEndpoint = noRefreshEndpoints.some((endpoint) =>
          (originalRequest.url as string)?.includes(endpoint),
        );

        // Only attempt refresh for non-auth endpoints
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isNoRefreshEndpoint
        ) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            originalRequest._retry = true;

            try {
              await axios.post(
                `${env.API_BASE_URL}/admin-auth/refresh`,
                {},
                {
                  withCredentials: true,
                  headers: { "Accept-Language": getCurrentLanguage() },
                },
              );

              this.isRefreshing = false;
              // Retry the original request
              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              this.isRefreshing = false;
              console.error("[Token Refresh] Failed to refresh tokens");
              // Redirect to login on refresh failure — but NOT when we're
              // already on an auth page. The auth screens probe session state
              // via check-auth on mount; a hard window redirect there reloads
              // the page, re-triggers the probe, and loops forever. On auth
              // pages the rejection propagates to the caller (e.g. the store's
              // checkAuth), which sets isAuthenticated:false and lets the
              // router keep the user on the login screen via client nav.
              if (
                typeof window !== "undefined" &&
                !window.location.pathname.startsWith("/auth")
              ) {
                window.location.href = "/auth/login";
              }
              throw refreshError;
            }
          } else {
            return new Promise((resolve) => {
              this.refreshSubscribers.push(() => {
                resolve(this.axiosInstance(originalRequest));
              });
            });
          }
        }

        // Normalize message: server may return array of validation messages
        let messageField = data?.message as unknown;
        let messageString = error.message || "API request failed";
        let messageDetails: string[] | string | undefined = undefined;
        if (Array.isArray(messageField)) {
          messageDetails = messageField as string[];
          messageString = (messageField as string[]).join("; ");
        } else if (typeof messageField === "string") {
          messageString = messageField;
        }

        let details: string | string[] | undefined = messageDetails;
        if (!details && typeof data?.message === "string") {
          details = data.message as string;
        }

        const apiError: ApiError = {
          code: error.response?.status || 500,
          message: messageString,
          details,
          error: data?.error as string | undefined,
          data: data as Record<string, unknown> | undefined,
        };
        console.error(
          `[API Error] ${apiError.code} ${error.config?.url}:`,
          apiError,
        );
        console.error(`Response body:`, data);
        throw apiError;
      },
    );
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.axiosInstance.get<unknown, ApiResponse<T>>(endpoint);
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.axiosInstance.post<unknown, ApiResponse<T>>(endpoint, body);
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.axiosInstance.patch<unknown, ApiResponse<T>>(endpoint, body);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.axiosInstance.delete<unknown, ApiResponse<T>>(endpoint);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(env.API_BASE_URL);
