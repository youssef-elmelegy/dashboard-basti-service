import { apiClient, type ApiError, type ApiResponse } from "../api-client";
import axios from "axios";
import { env } from "@/config/env";

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  // Tokens are stored in HTTP-only cookies by the server
  // They are not included in the response body for security
  admin: {
    id: string;
    email: string;
    role: "super_admin" | "admin" | "manager";
    profileImage?: string;
    bakeryId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface AdminForgotPasswordRequest {
  email: string;
}

export interface AdminForgotPasswordResponse {
  email: string;
}

export interface AdminVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AdminVerifyOtpResponse {
  // The reset token is returned as an httpOnly cookie, not in the body —
  // it is intentionally unreadable from JS.
  email: string;
}

export interface AdminResetPasswordRequest {
  newPassword: string;
}

export interface AdminResetPasswordResponse {
  message: string;
}

export interface CheckAuthResponse {
  isAuthenticated: boolean;
  admin?: {
    id: string;
    email: string;
    role: "super_admin" | "admin" | "manager";
    profileImage?: string;
    bakeryId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * Rebuilds an `ApiError` from a raw `AxiosError`.
 *
 * Mirrors the normalization in `ApiClient`'s response interceptor so requests
 * that deliberately skip `apiClient` still reject with the shape every caller
 * (and `getApiErrorMessage`) expects. The backend message wins over axios's
 * transport message — the latter is only ever "Request failed with status
 * code N", which tells the user nothing. Non-axios errors pass through
 * untouched.
 */
function normalizeAxiosError(error: unknown): unknown {
  if (!axios.isAxiosError(error)) return error;

  const data = error.response?.data as Record<string, unknown> | undefined;
  const messageField = data?.message as unknown;

  // The server sends `message` as either a string or an array of validation
  // messages; keep the array as `details` so callers can show them granularly.
  let message = error.message || "API request failed";
  let details: string[] | string | undefined;
  if (Array.isArray(messageField)) {
    details = messageField as string[];
    message = (messageField as string[]).join("; ");
  } else if (typeof messageField === "string" && messageField.trim() !== "") {
    message = messageField;
    details = messageField;
  }

  const apiError: ApiError = {
    code: error.response?.status || 500,
    message,
    details,
    error: data?.error as string | undefined,
    data,
  };
  return apiError;
}

class AuthApi {
  async login(
    data: AdminLoginRequest,
  ): Promise<ApiResponse<AdminLoginResponse>> {
    return apiClient.post<AdminLoginResponse>("/admin-auth/login", data);
  }

  async forgotPassword(
    data: AdminForgotPasswordRequest,
  ): Promise<ApiResponse<AdminForgotPasswordResponse>> {
    return apiClient.post<AdminForgotPasswordResponse>(
      "/admin-auth/forgot-password",
      data,
    );
  }

  async verifyOtp(
    data: AdminVerifyOtpRequest,
  ): Promise<ApiResponse<AdminVerifyOtpResponse>> {
    return apiClient.post<AdminVerifyOtpResponse>(
      "/admin-auth/verify-otp",
      data,
    );
  }

  async resetPassword(
    data: AdminResetPasswordRequest,
  ): Promise<ApiResponse<AdminResetPasswordResponse>> {
    // Use direct axios call to bypass auth interceptor since we're using cookie-based auth here
    try {
      const response = await axios.post<ApiResponse<AdminResetPasswordResponse>>(
        `${env.API_BASE_URL}/admin-auth/reset-password`,
        data,
        {
          withCredentials: true, // Send cookies
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      // Bypassing apiClient also bypasses its response interceptor, so nothing
      // reads the error body here — a raw AxiosError surfaces as the useless
      // "Request failed with status code 400" while the server's actual
      // message sits unread in the body. Normalize to the same ApiError shape
      // the interceptor produces so callers get one shape to handle.
      throw normalizeAxiosError(error);
    }
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>("/admin-auth/logout", {});
  }

  async checkAuth(): Promise<ApiResponse<CheckAuthResponse>> {
    return apiClient.get<CheckAuthResponse>("/admin-auth/check-auth");
  }
}

export const authApi = new AuthApi();
