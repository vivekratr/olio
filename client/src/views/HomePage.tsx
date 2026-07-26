"use client";

import Link from "next/link";

import { GettingStarted } from "@/components/onboarding/GettingStarted";
import { PageLayout } from "@/components/ui/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAudiences } from "@/hooks/useAudiences";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { useTags } from "@/hooks/useTags";

function StatCard({
  label,
  value,
  href,
  tint,
  loading = false,
}: {
  label: string;
  value: number | string;
  href: string;
  tint: string;
  loading?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[16px] border border-[#d0d4e4] p-5 transition-colors hover:border-[#6161ff]"
      style={{ backgroundColor: tint }}
    >
      <p className="text-sm font-medium text-[#535768]">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className="mt-1 text-3xl font-light tracking-[-0.02em] text-[#333333]">
          {value}
        </p>
      )}
      <p className="mt-3 text-xs font-medium text-[#6161ff] opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:transition-none">
        Open {label.toLowerCase()} →
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

  const sentCampaigns = campaigns.filter(
    (campaign) =>
      campaign.status === "sent" ||
      campaign.status === "sending" ||
      campaign.status === "scheduled",
  ).length;

  return (
    <PageLayout eyebrow="Dashboard" title="Welcome to Olio">
      <div className="space-y-6">
        <section aria-label="Workspace overview">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-[#333333]">
                Workspace overview
              </h2>
              <p className="mt-1 text-sm text-[#535768]">
                Your contacts, audiences, and campaigns at a glance.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Contacts"
              value={contactsData?.pagination.total ?? 0}
              href="/contacts"
              tint="#e7ecff"
              loading={contactsLoading}
            />
            <StatCard
              label="Tags"
              value={tags.length}
              href="/tags"
              tint="#eddff7"
              loading={tagsLoading}
            />
            <StatCard
              label="Audiences"
              value={audiences.length}
              href="/audiences"
              tint="#abf0ff"
              loading={audiencesLoading}
            />
            <StatCard
              label="Active campaigns"
              value={sentCampaigns}
              href="/campaigns"
              tint="#bcfe90"
              loading={campaignsLoading}
            />
          </div>
        </section>

        <GettingStarted />

        <section
          aria-label="Quick tips"
          className="rounded-[16px] border border-[#d0d4e4] bg-[#f5f6f8] px-5 py-4"
        >
          <p className="text-sm text-[#535768]">
            <span className="font-medium text-[#333333]">Tip:</span> Import
            contacts from CSV — duplicates skip automatically. Audiences update
            when contacts match your filters. Campaign analytics refresh every
            few seconds after send.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
