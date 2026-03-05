import { type ApiResponse } from "../api-client";
import axios, { type AxiosInstance } from "axios";
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

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        if (!isRefreshing) {
          isRefreshing = true;
          originalRequest._retry = true;

          try {
            await axios.post(
              `${env.API_BASE_URL}/admin-auth/refresh`,
              {},
              { withCredentials: true },
            );

            isRefreshing = false;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            console.error("[Chef Upload] Token refresh failed");
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login";
            }
            throw refreshError;
          }
        }
      }

      console.error(`[Chef Upload] Error ${error.response?.status}:`, data);
      throw error;
    },
  );
}

/**
 * Upload image to generic upload endpoint
 * @param file - Image file to upload
 * @param folder - Target folder in Cloudinary (e.g., 'basti/chefs', 'basti/products')
 * @returns CloudinaryUploadResult with secure_url
 */
export async function uploadImage(
  file: File,
  folder: string = "basti/general",
): Promise<ApiResponse<CloudinaryUploadResult>> {
  const formData = new FormData();
  formData.append("file", file);

  const uploadAxios = axios.create({
    baseURL: env.API_BASE_URL,
    withCredentials: true,
  });

  addAutoRefreshInterceptor(uploadAxios);

  // Use axios directly for multipart form data (not apiClient which forces application/json)
  // Let the browser set Content-Type with the boundary
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
 * @param urls - Array of Cloudinary image URLs to delete
 * @returns DeleteImageResult with success/failed counts
 */
export async function deleteImages(
  urls: string[],
): Promise<ApiResponse<DeleteImageResult>> {
  // Create axios instance with auto-refresh on 401
  const deleteAxios = axios.create({
    baseURL: env.API_BASE_URL,
    withCredentials: true,
  });

  addAutoRefreshInterceptor(deleteAxios);

  const response = await deleteAxios.delete<ApiResponse<DeleteImageResult>>(
    `/uploads/images`,
    {
      data: { urls },
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}
