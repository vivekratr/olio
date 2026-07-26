"use client";

import { useQuery } from "@tanstack/react-query";

import { getCampaignAnalytics } from "@/services/analytics.service";
import type { CampaignAnalyticsResponse } from "@/types/analytics.types";

export function useCampaignAnalytics(campaignId: string) {
  const { data, isPending, error, refetch, isFetching } =
    useQuery<CampaignAnalyticsResponse>({
      queryKey: ["campaignAnalytics", campaignId],
      queryFn: () => getCampaignAnalytics(campaignId),
      enabled: Boolean(campaignId),
      refetchInterval: 3000,
      retry: false,
    });

  return {
    data,
    loading: isPending,
    error: error ?? null,
    refetch,
    refetching: isFetching && !isPending,
  };
}
