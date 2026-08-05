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
  displayOrder: number;
  tagId?: string | null;
  /**
   * Set by the backend when the linked tag is deleted. There is no manual
   * toggle for this — attaching a new tag is what clears it.
   */
  isHidden?: boolean;
  createdAt: string;
}

/**
 * Slider Image request payload
 */
export interface SliderImageItem {
  /** Omit to create a new image; supply it to update that row in place. */
  id?: string;
  title: string;
  imageUrl: string;
  displayOrder: number;
  tagId?: string | null;
}

/**
 * Slider Image API service with CRUD methods
 */
export const sliderImageApi = {
  /**
   * Get all slider images
   */
  getAll: (): Promise<ApiResponse<SliderImage[]>> => {
    // Admin listing: includes images hidden by a tag deletion so they can be
    // re-linked. The public route filters them out.
    return apiClient.get<SliderImage[]>("/slider-images/admin");
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
