"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAudiences } from "@/hooks/useAudiences";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { useTags } from "@/hooks/useTags";

const COLLAPSED_STORAGE_KEY = "olio_getting_started_collapsed";

interface Step {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
  optional?: boolean;
}

function StepIndicator({ done, optional }: { done: boolean; optional?: boolean }) {
  if (done) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#bcfe90] text-[#333333]">
        <svg aria-hidden className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d0d4e4] bg-[#f5f6f8] text-xs font-medium text-[#535768]">
      {optional ? "·" : "→"}
    </span>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden
      className={`h-5 w-5 text-[#535768] transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export function GettingStarted() {
  const panelId = useId();
  const { data: contactsData, loading: contactsLoading } = useContacts({
    page: 1,
    limit: 1,
  });
  const { tags, loading: tagsLoading } = useTags();
  const { audiences, loading: audiencesLoading } = useAudiences();
  const { campaigns, loading: campaignsLoading } = useCampaigns();

  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const loading =
    contactsLoading || tagsLoading || audiencesLoading || campaignsLoading;

  const contactCount = contactsData?.pagination.total ?? 0;
  const hasSentCampaign = campaigns.some(
    (campaign) =>
      campaign.status === "sent" ||
      campaign.status === "sending" ||
      campaign.status === "scheduled" ||
      campaign.status === "failed",
  );

  const steps: Step[] = [
    {
      id: "contacts",
      title: "Add your contacts",
      description:
        "Import a CSV or add people one at a time. Contacts are the foundation for every audience and campaign.",
      href: "/contacts",
      cta: "Go to contacts",
      done: contactCount > 0,
    },
    {
      id: "tags",
      title: "Create tags",
      description:
        "Label contacts with tags like Newsletter or VIP so you can filter and target them later.",
      href: "/tags",
      cta: "Create a tag",
      done: tags.length > 0,
      optional: true,
    },
    {
      id: "audiences",
      title: "Build an audience",
      description:
        "Save a filtered group of contacts — by tag, city, or custom field — to reuse when sending.",
      href: "/audiences",
      cta: "Build audience",
      done: audiences.length > 0,
    },
    {
      id: "campaign",
      title: "Create a campaign",
      description:
        "Write your email, pick recipients from an audience or tag, then send now or schedule for later.",
      href: "/campaigns/new",
      cta: "Create campaign",
      done: campaigns.length > 0,
    },
    {
      id: "analytics",
      title: "Track delivery & opens",
      description:
        "Once a campaign sends, open its analytics page to watch sent, delivered, and opened counts update live.",
      href: "/campaigns",
      cta: "View campaigns",
      done: hasSentCampaign,
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const allDone = completedCount === steps.length;
  const nextStep = steps.find((step) => !step.done);
  const progressPercent = (completedCount / steps.length) * 100;

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (stored === "true") {
      setExpanded(false);
    } else if (stored === "false") {
      setExpanded(true);
    } else {
      setExpanded(completedCount === 0);
    }
    setHydrated(true);
  }, [completedCount]);

  const setCollapsed = (collapsed: boolean) => {
    setExpanded(!collapsed);
    localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "true" : "false");
  };

  if (loading || !hydrated) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading getting started steps"
        className="rounded-[16px] border border-[#d0d4e4] bg-white p-4"
      >
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[#d0d4e4] bg-[#e7ecff] px-5 py-4">
        <div>
          <p className="font-medium text-[#333333]">You&apos;re all set</p>
          <p className="mt-0.5 text-sm text-[#535768]">
            Workspace ready — send a campaign or check analytics on a recent send.
          </p>
        </div>
        <Link href="/campaigns">
          <Button>View campaigns</Button>
        </Link>
      </div>
    );
  }

  return (
    <section
      aria-label="Getting started checklist"
      className="overflow-hidden rounded-[16px] border border-[#d0d4e4] bg-white"
    >
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <button
          type="button"
          className="btn-interactive flex min-w-0 flex-1 items-center gap-3 rounded-[12px] text-left hover:bg-[#f5f6f8]/70"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setCollapsed(expanded)}
        >
          <ChevronIcon expanded={expanded} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-medium text-[#333333]">Get started</p>
              <span className="text-sm font-medium text-[#6161ff]">
                {completedCount} of {steps.length} complete
              </span>
            </div>
            {!expanded && nextStep ? (
              <p className="mt-0.5 truncate text-sm text-[#535768]">
                Next: {nextStep.title}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-[#535768]">
                Follow these steps to send your first email campaign.
              </p>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {!expanded && nextStep ? (
            <Link href={nextStep.href}>
              <Button className="whitespace-nowrap">{nextStep.cta}</Button>
            </Link>
          ) : null}
          <button
            type="button"
            className="btn-interactive rounded-full px-3 py-1.5 text-sm font-medium text-[#535768] hover:bg-[#f5f6f8] hover:text-[#333333]"
            onClick={() => setCollapsed(true)}
          >
            Hide
          </button>
        </div>
      </div>

      <div
        className="h-1 bg-[#f5f6f8]"
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-label="Onboarding progress"
      >
        <div
          className="h-full bg-[#6161ff] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div
        id={panelId}
        hidden={!expanded}
        className="border-t border-[#d0d4e4] px-5 py-4"
      >
        <ol className="space-y-2">
          {steps.map((step) => {
            const isNext = nextStep?.id === step.id;

            return (
              <li
                key={step.id}
                className={`flex items-start gap-3 rounded-[12px] border px-3 py-3 ${
                  isNext
                    ? "border-[#6161ff] bg-[#e7ecff]/40"
                    : step.done
                      ? "border-transparent bg-[#f5f6f8]/80"
                      : "border-transparent bg-[#f5f6f8]/40"
                }`}
              >
                <StepIndicator done={step.done} optional={step.optional} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm font-medium ${step.done ? "text-[#535768] line-through" : "text-[#333333]"}`}
                    >
                      {step.title}
                    </p>
                    {step.optional ? (
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#535768]">
                        Optional
                      </span>
                    ) : null}
                  </div>
                  {expanded ? (
                    <p className="mt-1 text-sm text-[#535768]">{step.description}</p>
                  ) : null}
                </div>
                {!step.done && isNext ? (
                  <Link href={step.href} className="shrink-0">
                    <Button className="whitespace-nowrap text-sm">{step.cta}</Button>
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
