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
  /**
   * Create a new tag
   */
  create: (body: CreateTagRequest): Promise<ApiResponse<Tag>> =>
    apiClient.post<Tag>("/tags", body),

  /**
   * Update an existing tag
   */
  update: (id: string, body: UpdateTagRequest): Promise<ApiResponse<Tag>> =>
    apiClient.patch<Tag>(`/tags/${id}`, body),

  /**
   * Delete a tag
   */
  delete: (id: string): Promise<ApiResponse<Record<string, unknown>>> =>
    apiClient.delete(`/tags/${id}`),
};

/**
 * Request types
 */
export interface CreateTagRequest {
  name: string;
  displayOrder: number;
}

export interface UpdateTagRequest {
  name: string;
  displayOrder: number;
}
