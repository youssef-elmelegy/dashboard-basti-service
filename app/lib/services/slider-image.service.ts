/**
 * Slider Image API Service
 * Handles all slider image related API calls
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

/**
 * Slider Image data model
 */
export interface SliderImage {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
}

/**
 * Slider Image request payload
 */
export interface SliderImageItem {
  title: string;
  imageUrl: string;
}

/**
 * Slider Image API service with CRUD methods
 */
export const sliderImageApi = {
  /**
   * Get all slider images
   */
  getAll: (): Promise<ApiResponse<SliderImage[]>> => {
    return apiClient.get<SliderImage[]>("/slider-images");
  },

  /**
   * Update slider images (bulk - replaces all)
   */
  update: (items: SliderImageItem[]): Promise<ApiResponse<SliderImage[]>> => {
    return apiClient.post<SliderImage[]>("/slider-images", items);
  },

  /**
   * Delete slider image by ID
   */
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/slider-images/${id}`);
  },
};
