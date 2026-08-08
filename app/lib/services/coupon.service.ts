import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

export type DiscountType = "percentage" | "fixed_amount" | "free_shipping";

export const DISCOUNT_TYPES: DiscountType[] = [
  "percentage",
  "fixed_amount",
  "free_shipping",
];

export interface Coupon {
  id: string;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number | null;
  startDate: string | null;
  expiryDate: string | null;
  usageLimitGlobal: number;
  usageLimitPerUser: number;
  isGlobal: boolean;
  isActive: boolean;
  regionId?: string | null;
  regionName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCouponPayload {
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  startDate?: string;
  expiryDate?: string;
  usageLimitGlobal: number;
  usageLimitPerUser: number;
  isGlobal: boolean;
  isActive: boolean;
  regionId?: string;
}

export type UpdateCouponPayload = Partial<GenerateCouponPayload>;

export const couponApi = {
  getAll: (): Promise<ApiResponse<Coupon[]>> =>
    apiClient.get<Coupon[]>("/coupon"),

  getOne: (id: string): Promise<ApiResponse<Coupon>> =>
    apiClient.get<Coupon>(`/coupon/${id}`),

  create: (body: GenerateCouponPayload): Promise<ApiResponse<Coupon>> =>
    apiClient.post<Coupon>("/coupon/generate", body),

  update: (id: string, body: UpdateCouponPayload): Promise<ApiResponse<Coupon>> =>
    apiClient.patch<Coupon>(`/coupon/${id}`, body),

  toggleStatus: (id: string): Promise<ApiResponse<Coupon>> =>
    apiClient.patch<Coupon>(`/coupon/${id}/toggle-status`, {}),

  delete: (id: string): Promise<ApiResponse<Record<string, unknown>>> =>
    apiClient.delete(`/coupon/${id}`),

  checkCodeExists: (code: string): Promise<ApiResponse<boolean>> =>
    apiClient.get<boolean>(`/coupon/check/${code}`),
};
