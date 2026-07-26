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

export interface CampaignSummary {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  recipientMode: "audience" | "tag" | "paste";
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAnalyticsResponse {
  campaign: CampaignSummary;
  metrics: CampaignMetrics;
  rates: CampaignRates;
  timeline: Array<{
    bucket: string;
    eventType: string;
    count: number;
  }>;
}
