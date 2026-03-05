/**
 * Add-On Image Upload Service
 * Handles image upload and deletion for add-ons
 */

import axios, { type AxiosInstance } from "axios";
import type { ApiResponse } from "@/lib/api-client";
import { env } from "@/config/env";

/**
 * Cloudinary upload result
 */
export interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  size: number;
  format: string;
  resource_type: string;
}

/**
 * Delete image result
 */
export interface DeleteImageResult {
  results: Array<{ url: string; success: boolean }>;
  success: number;
  failed: number;
}

/**
 * Helper function to add 401 auto-refresh interceptor to axios instance
 */
function addAutoRefreshInterceptor(axiosInstance: AxiosInstance) {
  let isRefreshing = false;

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as unknown as Record<
        string,
        unknown
      >;
      const data = error.response?.data as Record<string, unknown> | undefined;

      // If it's a 401 and we haven't already tried to refresh
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        if (!isRefreshing) {
          isRefreshing = true;
          originalRequest._retry = true;

          try {
            // Try to refresh tokens using the refresh endpoint
            await axios.post(
              `${env.API_BASE_URL}/admin-auth/refresh`,
              {},
              { withCredentials: true },
            );

            isRefreshing = false;
            // Retry the original request
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            console.error("[Image Upload] Token refresh failed");
            // Redirect to login on refresh failure
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login";
            }
            throw refreshError;
          }
        }
      }

      console.error(`[Image Upload] Error ${error.response?.status}:`, data);
      throw error;
    },
  );
}

/**
 * Upload image to Cloudinary
 */
export const uploadImage = async (
  file: File,
  folder: string = "basti/addons",
): Promise<ApiResponse<CloudinaryUploadResult>> => {
  try {
    console.log("[uploadImage] Uploading with folder:", folder);

    const formData = new FormData();
    formData.append("file", file);

    // Create axios instance with auto-refresh on 401
    const uploadAxios = axios.create({
      baseURL: env.API_BASE_URL,
      withCredentials: true,
    });

    addAutoRefreshInterceptor(uploadAxios);

    const response = await uploadAxios.post(
      `/uploads/image?folder=${encodeURIComponent(folder)}`,
      formData,
      {
        headers: {
          // Don't set Content-Type - let axios/browser set it with boundary for multipart
        },
      },
    );

    console.log("[uploadImage] Upload response:", response);
    return response.data;
  } catch (error) {
    console.error("[uploadImage] Error uploading image:", error);
    throw error;
  }
};

/**
 * Delete images by URLs
 */
export const deleteImages = async (
  urls: string[],
): Promise<ApiResponse<DeleteImageResult>> => {
  try {
    console.log("[deleteImages] Deleting images");

    // Create axios instance with auto-refresh on 401
    const deleteAxios = axios.create({
      baseURL: env.API_BASE_URL,
      withCredentials: true,
    });

    addAutoRefreshInterceptor(deleteAxios);

    const response = await deleteAxios.delete(`/uploads/images`, {
      data: { urls },
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("[deleteImages] Delete response:", response);
    return response.data;
  } catch (error) {
    console.error("[deleteImages] Error deleting images:", error);
    throw error;
  }
};
