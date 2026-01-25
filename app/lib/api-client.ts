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

  constructor(baseUrl: string) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use((config) => {
      console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
      return config;
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.debug(`[API Response] ${response.status} ${response.config.url}`, response.data);
        return response.data;
      },
      (error: AxiosError) => {
        const data = error.response?.data as Record<string, unknown>;
        const apiError: ApiError = {
          code: error.response?.status || 500,
          message:
            (data?.message as string) || error.message || "API request failed",
          error: data?.error as string,
        };
        console.error(`[API Error] ${apiError.code} ${error.config?.url}:`, apiError);
        console.error(`Response body:`, data);
        throw apiError;
      }
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
