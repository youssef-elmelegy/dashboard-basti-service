import { type ApiResponse } from "../api-client";
import axios from "axios";
import { env } from "@/config/env";

export interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  size: number;
  format: string;
  resource_type: string;
}

export interface DeleteImageDto {
  urls: string[];
}

export interface DeleteImageResult {
  results: Record<string, string>;
  success: number;
  failed: number;
}

/**
 * Upload image to generic upload endpoint
 * @param file - Image file to upload
 * @param folder - Target folder in Cloudinary (e.g., 'basti/cakes', 'basti/products')
 * @returns CloudinaryUploadResult with secure_url
 */
export async function uploadImage(
  file: File,
  folder: string = "basti/cakes",
): Promise<ApiResponse<CloudinaryUploadResult>> {
  const formData = new FormData();
  formData.append("file", file);

  console.log(
    "[uploadImage] Uploading file to:",
    `${env.API_BASE_URL}/uploads/image?folder=${encodeURIComponent(folder)}`,
  );
  console.log(
    "[uploadImage] File:",
    file.name,
    "Size:",
    file.size,
    "Type:",
    file.type,
  );

  // Create axios instance with interceptors that includes auto-refresh
  const uploadAxios = axios.create({
    baseURL: env.API_BASE_URL,
    withCredentials: true,
  });

  // Add the same response interceptor for auto-refresh on 401
  let isRefreshing = false;
  uploadAxios.interceptors.response.use(
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
            return uploadAxios(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            console.error("[uploadImage] Token refresh failed");
            // Redirect to login on refresh failure
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login";
            }
            throw refreshError;
          }
        }
      }

      console.error(`[uploadImage] Error ${error.response?.status}:`, data);
      throw error;
    },
  );

  return uploadAxios
    .post<ApiResponse<CloudinaryUploadResult>>(
      `/uploads/image?folder=${encodeURIComponent(folder)}`,
      formData,
      {
        headers: {
          // Don't set Content-Type - let axios/browser set it with boundary for multipart
        },
      },
    )
    .then((res) => res.data);
}

/**
 * Delete images by URL array
 * Uses HTTP-only cookies for authentication (no manual token needed)
 * @param urls - Array of Cloudinary image URLs to delete
 * @returns DeleteImageResult with success/failed counts
 */
export async function deleteImages(
  urls: string[],
): Promise<ApiResponse<DeleteImageResult>> {
  const formData = new FormData();
  formData.append("urls", JSON.stringify(urls));

  // Create axios instance with interceptors that includes auto-refresh
  const deleteAxios = axios.create({
    baseURL: env.API_BASE_URL,
    withCredentials: true,
  });

  // Add the same response interceptor for auto-refresh on 401
  let isRefreshing = false;
  deleteAxios.interceptors.response.use(
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
            return deleteAxios(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            console.error("[deleteImages] Token refresh failed");
            // Redirect to login on refresh failure
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login";
            }
            throw refreshError;
          }
        }
      }

      console.error(`[deleteImages] Error ${error.response?.status}:`, data);
      throw error;
    },
  );

  return deleteAxios
    .delete<ApiResponse<DeleteImageResult>>(`/uploads/images`, {
      data: { urls },
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((res) => res.data);
}
