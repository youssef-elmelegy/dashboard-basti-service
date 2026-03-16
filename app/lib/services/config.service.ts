import { apiClient, type ApiResponse } from "@/lib/api-client";

export interface ConfigResponseDto {
  id: string;
  openingHour: number;
  closingHour: number;
  minHoursToPrepare: number;
  weekendDays: number[];
  holidays: string[];
  emergencyClosures: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
  isOpen: boolean;
  closureMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateConfigRequest {
  openingHour?: number;
  closingHour?: number;
  minHoursToPrepare?: number;
  weekendDays?: number[];
  holidays?: string[];
  emergencyClosures?: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
  isOpen?: boolean;
  closureMessage?: string | null;
}

export const configApi = {
  /**
   * Get app configuration
   */
  async getConfig(): Promise<ApiResponse<ConfigResponseDto>> {
    return apiClient.get<ConfigResponseDto>("/config");
  },

  /**
   * Update app configuration
   */
  async updateConfig(
    data: UpdateConfigRequest,
  ): Promise<ApiResponse<ConfigResponseDto>> {
    return apiClient.patch<ConfigResponseDto>("/config", data);
  },
};
