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
  types?: TagType[];
  createdAt: string;
  updatedAt: string;
}

export type TagType = "sweets" | "decorations" | "predesigned-cakes" | "addons";

export const TAG_TYPES: TagType[] = [
  "sweets",
  "decorations",
  "predesigned-cakes",
  "addons",
];

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
   * Report what a tag is attached to, without changing anything.
   */
  getUsage: (id: string): Promise<ApiResponse<TagUsage>> =>
    apiClient.get<TagUsage>(`/tags/${id}/usage`),

  /**
   * Delete a tag.
   *
   * Without `force` the backend refuses with 409 when the tag is still linked to
   * products or slider images, so the admin can be shown the impact first.
   */
  delete: (
    id: string,
    force = false,
  ): Promise<ApiResponse<Record<string, unknown>>> =>
    apiClient.delete(`/tags/${id}${force ? "?force=true" : ""}`),

  /**
   * Change tag order
   */
  changeOrder: (id: string, order: number): Promise<ApiResponse<Tag[]>> =>
    apiClient.patch<Tag[]>(`/tags/${id}/order`, { order }),
};

/**
 * Impact report for deleting a tag, used to warn the admin before they confirm.
 */
export interface TagUsage {
  tagId: string;
  tagName: string;
  sweets: number;
  addons: number;
  decorations: number;
  predesignedCakes: number;
  featuredCakes: number;
  totalProducts: number;
  sliderImages: { id: string; title: string }[];
  canDeleteSafely: boolean;
}

/**
 * Request types
 */
export interface CreateTagRequest {
  name: string;
  displayOrder: number;
  types: TagType[];
}

export interface UpdateTagRequest {
  name: string;
  displayOrder: number;
  types: TagType[];
}
