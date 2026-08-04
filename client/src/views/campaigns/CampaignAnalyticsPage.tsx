"use client";

import { memo, useMemo } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLayout } from "@/components/ui/PageLayout";
import { CampaignRecipientsTable } from "@/components/campaigns/CampaignRecipientsTable";
import { useCampaign } from "@/hooks/useCampaigns";
import { useCampaignAnalytics } from "@/hooks/useCampaignAnalytics";
import { useToast } from "@/providers/ToastProvider";
import type {
  CampaignMetrics,
  CampaignRates,
} from "@/types/analytics.types";

interface CampaignAnalyticsPageProps {
  campaignId: string;
}

interface StatCardProps {
  label: string;
  value: string;
  tint: string;
}

const EMPTY_METRICS: CampaignMetrics = {
  total: 0,
  pending: 0,
  sent: 0,
  delivered: 0,
  opened: 0,
  bounced: 0,
  failed: 0,
};

const EMPTY_RATES: CampaignRates = {
  deliveryRate: 0,
  openRate: 0,
  bounceRate: 0,
};

const StatCard = memo(function StatCard({ label, value, tint }: StatCardProps) {
  return (
    <article
      className="rounded-[24px] border border-[#d0d4e4] bg-white p-6 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]"
      style={{ backgroundColor: tint }}
    >
      <p className="text-sm font-medium text-[#535768]">{label}</p>
      <p className="mt-2 text-3xl font-light tracking-[-0.02em] text-[#333333]">
        {value}
      </p>
    </article>
  );
});

function formatCount(value: number): string {
  return value.toLocaleString();
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#d0d4e4] bg-white px-3 py-1 text-xs font-medium text-[#535768]">
      <span
        aria-hidden
        className="h-2 w-2 animate-pulse rounded-full bg-[#6161ff] motion-reduce:animate-none"
      />
      Live updates
    </span>
  );
}

function SendingBanner() {
  return (
    <div
      aria-live="polite"
      className="rounded-[16px] border border-[#d0d4e4] bg-[#e7ecff] px-4 py-3 text-sm text-[#535768]"
    >
      <p className="font-medium text-[#333333]">Your campaign is sending</p>
      <p className="mt-1">
        Delivery stats will fill in here automatically as emails go out.
      </p>
    </div>
  );
}

function buildCountStats(metrics: CampaignMetrics) {
  return [
    { label: "Sent", value: formatCount(metrics.sent), tint: "#e7ecff" },
    {
      label: "Delivered",
      value: formatCount(metrics.delivered),
      tint: "#bcfe90",
    },
    { label: "Opened", value: formatCount(metrics.opened), tint: "#abf0ff" },
    {
      label: "Bounced",
      value: formatCount(metrics.bounced),
      tint: "#eddff7",
    },
  ];
}

function buildRateStats(rates: CampaignRates) {
  return [
    {
      label: "Delivery Rate",
      value: formatRate(rates.deliveryRate),
      tint: "#d1faff",
    },
    {
      label: "Open Rate",
      value: formatRate(rates.openRate),
      tint: "#dbdbff",
    },
    {
      label: "Bounce Rate",
      value: formatRate(rates.bounceRate),
      tint: "#fcd0f8",
    },
  ];
}

export function CampaignAnalyticsPage({ campaignId }: CampaignAnalyticsPageProps) {
  const { toast } = useToast();
  const { data, loading, error, refetch, refetching } =
    useCampaignAnalytics(campaignId);
  const { campaign: cachedCampaign } = useCampaign(campaignId);

  const metrics = data?.metrics ?? EMPTY_METRICS;
  const rates = data?.rates ?? EMPTY_RATES;
  const recipients = data?.recipients ?? [];
  const status = data?.campaign.status ?? cachedCampaign?.status;
  const title = data?.campaign.name ?? cachedCampaign?.name ?? "Campaign analytics";

  const inProgress =
    loading ||
    (metrics.sent === 0 &&
      (status === "sending" || status === "scheduled"));

  const countStats = useMemo(() => buildCountStats(metrics), [metrics]);
  const rateStats = useMemo(() => buildRateStats(rates), [rates]);

  const handleRetry = async () => {
    const result = await refetch();
    if (result.error) {
      toast(
        result.error.message || "Still unable to load analytics.",
        "error",
      );
      return;
    }

    toast("Analytics refreshed.", "success");
  };

  if (error && !data) {
    return (
      <PageLayout eyebrow="Campaign analytics">
        <ErrorState
          title="Could not load analytics"
          message={error.message}
          onRetry={handleRetry}
          retryLoading={refetching}
        />
      </PageLayout>
    );
  }

  if (!loading && !data) {
    return (
      <PageLayout eyebrow="Campaign analytics">
        <ErrorState message="No analytics data returned. Please try again." />
      </PageLayout>
    );
  }

  if (!loading && data?.metrics.sent === 0 && data.campaign.status === "draft") {
    return (
      <PageLayout eyebrow="Campaign analytics">
        <EmptyState
          title={data.campaign.name}
          description="This campaign hasn't sent yet. Metrics will appear here once delivery starts."
          steps={[
            "Open the campaign editor and confirm recipients are set",
            "Click Send now or schedule a send time",
            "Return here to watch sent, delivered, and opened counts update live",
          ]}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      eyebrow="Campaign analytics"
      title={title}
      headerAction={<LiveBadge />}
    >
      <div className="space-y-8">
        {inProgress ? <SendingBanner /> : null}

        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-[#535768]">
            Delivery
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {countStats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                tint={stat.tint}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-[#535768]">
            Rates
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {rateStats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                tint={stat.tint}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-[#535768]">
            Recipients
          </h2>
          <div className="rounded-[24px] border border-[#d0d4e4] bg-white p-6 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
            <CampaignRecipientsTable
              recipients={recipients.map((recipient) => ({
                id: recipient.contactId,
                name: recipient.name,
                email: recipient.email,
                phone: recipient.phone,
                status: recipient.status,
              }))}
              showStatus
              emptyMessage="Recipient details will appear here once the campaign starts sending."
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
