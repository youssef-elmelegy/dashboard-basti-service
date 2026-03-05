import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";
import { env } from "@/config/env";

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
  error?: string;
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

    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use((config) => {
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

        // Endpoints that should NOT trigger a token refresh on 401
        const noRefreshEndpoints = [
          "/admin-auth/check-auth",
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
                { withCredentials: true },
              );

              this.isRefreshing = false;
              // Retry the original request
              return this.axiosInstance(originalRequest);
            } catch (refreshError) {
              this.isRefreshing = false;
              console.error("[Token Refresh] Failed to refresh tokens");
              // Redirect to login on refresh failure
              if (typeof window !== "undefined") {
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

        const apiError: ApiError = {
          code: error.response?.status || 500,
          message:
            (data?.message as string | undefined) ||
            error.message ||
            "API request failed",
          error: data?.error as string | undefined,
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
