import { apiGet } from "@/lib/api";
import type { CampaignAnalyticsResponse } from "@/types/analytics.types";

export function getCampaignAnalytics(
  campaignId: string,
): Promise<CampaignAnalyticsResponse> {
  return apiGet<CampaignAnalyticsResponse>(
    `/analytics/${campaignId}`,
  );
}
