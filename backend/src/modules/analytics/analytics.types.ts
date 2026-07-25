import type { CampaignResponse } from "../campaigns/campaign.types.js";

export interface CampaignMetrics {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
}

export interface CampaignRates {
  deliveryRate: number;
  openRate: number;
  bounceRate: number;
}

export interface CampaignTimelineEntry {
  bucket: string;
  eventType: string;
  count: number;
}

export interface CampaignAnalyticsResponse {
  campaign: CampaignResponse;
  metrics: CampaignMetrics;
  rates: CampaignRates;
  timeline: CampaignTimelineEntry[];
}
