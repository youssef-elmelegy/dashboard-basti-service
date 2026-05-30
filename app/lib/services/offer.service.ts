import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

export interface Offer {
  id: string;
  name: string;
  percentage: number;
  startDate: string | null;
  expiryDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
}

export interface CreateOfferPayload {
  name: string;
  percentage: number;
  startDate?: string;
  expiryDate?: string;
  isActive?: boolean;
}

export type UpdateOfferPayload = Partial<CreateOfferPayload>;

export type OfferItemType =
  | "addonId"
  | "featuredCakeId"
  | "sweetId"
  | "predesignedCakeId"
  | "decorationId"
  | "flavorId"
  | "shapeId";

export type OfferItemConnectionType =
  | "addon"
  | "featuredCake"
  | "sweet"
  | "predesignedCake"
  | "decoration"
  | "flavor"
  | "shape";

export interface OfferItem {
  regionId: string;
  regionName: string;
  type: OfferItemConnectionType;
  itemId: string;
  itemName: string;
}

export interface ToggleItemOfferPayload {
  offerId?: string;
  regionId: string;
  addonId?: string;
  featuredCakeId?: string;
  sweetId?: string;
  predesignedCakeId?: string;
  decorationId?: string;
  flavorId?: string;
  shapeId?: string;
}

export const offerApi = {
  getAll: (): Promise<ApiResponse<Offer[]>> =>
    apiClient.get<Offer[]>("/offer"),

  getOne: (id: string): Promise<ApiResponse<Offer>> =>
    apiClient.get<Offer>(`/offer/${id}`),

  create: (body: CreateOfferPayload): Promise<ApiResponse<Offer>> =>
    apiClient.post<Offer>("/offer", body),

  update: (id: string, body: UpdateOfferPayload): Promise<ApiResponse<Offer>> =>
    apiClient.patch<Offer>(`/offer/${id}`, body),

  toggleStatus: (id: string): Promise<ApiResponse<Offer>> =>
    apiClient.patch<Offer>(`/offer/${id}/toggle-status`, {}),

  delete: (id: string): Promise<ApiResponse<Record<string, unknown>>> =>
    apiClient.delete(`/offer/${id}`),

  toggleItem: (body: ToggleItemOfferPayload): Promise<ApiResponse<Record<string, unknown>>> =>
    apiClient.patch("/offer/toggle-item", body),

  getItems: (id: string): Promise<ApiResponse<OfferItem[]>> =>
    apiClient.get<OfferItem[]>(`/offer/${id}/items`),
};
