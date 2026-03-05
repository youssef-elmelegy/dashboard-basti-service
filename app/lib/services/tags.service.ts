/**
 * Tags API Service
 * Handles all tag-related API calls
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

/**
 * Tag data model
 */
export interface Tag {
  id: string;
  name: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tags API service with methods
 */
export const tagsApi = {
  /**
   * Get all tags
   */
  getAll: (): Promise<ApiResponse<Tag[]>> => {
    return apiClient.get<Tag[]>("/tags");
  },
};
