"use client";

import Link from "next/link";

import { GettingStarted } from "@/components/onboarding/GettingStarted";
import { DashboardSkeleton } from "@/components/ui/skeletons/DashboardSkeleton";
import { PageLayout } from "@/components/ui/PageLayout";
import { useAudiences } from "@/hooks/useAudiences";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { useTags } from "@/hooks/useTags";

function StatCard({
  label,
  value,
  href,
  tint,
}: {
  label: string;
  value: number | string;
  href: string;
  tint: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[16px] border border-[#d0d4e4] p-5 transition-colors hover:border-[#6161ff]"
      style={{ backgroundColor: tint }}
    >
      <p className="text-sm font-medium text-[#535768]">{label}</p>
      <p className="mt-1 text-2xl font-light tracking-[-0.02em] text-[#333333]">
        {value}
      </p>
    </Link>
  );
}

export function HomePage() {
  const { data: contactsData, loading: contactsLoading } = useContacts({
    page: 1,
    limit: 1,
  });
  const { tags, loading: tagsLoading } = useTags();
  const { audiences, loading: audiencesLoading } = useAudiences();
  const { campaigns, loading: campaignsLoading } = useCampaigns();

  const loading =
    contactsLoading || tagsLoading || audiencesLoading || campaignsLoading;

  const sentCampaigns = campaigns.filter(
    (campaign) =>
      campaign.status === "sent" ||
      campaign.status === "sending" ||
      campaign.status === "scheduled",
  ).length;

  return (
    <PageLayout eyebrow="Dashboard" title="Welcome to Olio">
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          <GettingStarted />

          <div>
            <h2 className="mb-4 text-sm font-medium text-[#535768]">
              Workspace overview
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Contacts"
                value={contactsData?.pagination.total ?? 0}
                href="/contacts"
                tint="#e7ecff"
              />
              <StatCard
                label="Tags"
                value={tags.length}
                href="/tags"
                tint="#eddff7"
              />
              <StatCard
                label="Audiences"
                value={audiences.length}
                href="/audiences"
                tint="#abf0ff"
              />
              <StatCard
                label="Active campaigns"
                value={sentCampaigns}
                href="/campaigns"
                tint="#bcfe90"
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d0d4e4] bg-white p-6 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
            <h2 className="text-sm font-medium text-[#333333]">Quick tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#535768]">
              <li>
                Import contacts from CSV — duplicates are skipped automatically.
              </li>
              <li>
                Audiences update dynamically when contacts match your filter
                rules.
              </li>
              <li>
                Open a campaign&apos;s analytics page to watch metrics refresh
                every few seconds.
              </li>
            </ul>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
