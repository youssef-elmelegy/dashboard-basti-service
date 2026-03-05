import { apiClient, type ApiResponse } from "../api-client";
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
  email: string;
  resetToken: string;
}

export interface AdminResetPasswordRequest {
  resetToken: string;
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
    return axios
      .post<ApiResponse<AdminResetPasswordResponse>>(
        `${env.API_BASE_URL}/admin-auth/reset-password`,
        data,
        {
          withCredentials: true, // Send cookies
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      .then((response) => response.data);
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>("/admin-auth/logout", {});
  }

  async checkAuth(): Promise<ApiResponse<CheckAuthResponse>> {
    return apiClient.get<CheckAuthResponse>("/admin-auth/check-auth");
  }
}

export const authApi = new AuthApi();
