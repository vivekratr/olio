"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { useAudiences } from "@/hooks/useAudiences";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { useTags } from "@/hooks/useTags";

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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#bcfe90] text-[#333333]">
        <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d0d4e4] bg-[#f5f6f8] text-xs font-medium text-[#535768]">
      {optional ? "·" : "→"}
    </span>
  );
}

export function GettingStarted() {
  const { data: contactsData, loading: contactsLoading } = useContacts({
    page: 1,
    limit: 1,
  });
  const { tags, loading: tagsLoading } = useTags();
  const { audiences, loading: audiencesLoading } = useAudiences();
  const { campaigns, loading: campaignsLoading } = useCampaigns();

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

  if (loading) {
    return null;
  }

  if (allDone) {
    return (
      <div className="rounded-[24px] border border-[#d0d4e4] bg-[#e7ecff] p-8">
        <p className="text-lg font-medium text-[#333333]">
          You&apos;re all set!
        </p>
        <p className="mt-2 text-sm text-[#535768]">
          Your workspace has contacts, audiences, and campaigns. Head to
          Campaigns to send your next email or check analytics on a recent
          send.
        </p>
        <div className="mt-4">
          <Link href="/campaigns">
            <Button>View campaigns</Button>
          </Link>
        </div>
      </div>
    );
  }

  const nextStep = steps.find((step) => !step.done);

  return (
    <div className="rounded-[24px] border border-[#d0d4e4] bg-white p-8 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-[#333333]">Get started</h2>
          <p className="mt-1 text-sm text-[#535768]">
            Follow these steps to send your first email campaign.
          </p>
        </div>
        <p className="text-sm font-medium text-[#6161ff]">
          {completedCount} of {steps.length} complete
        </p>
      </div>

      <ol className="mt-8 space-y-3">
        {steps.map((step) => {
          const isNext = nextStep?.id === step.id;

          return (
            <li
              key={step.id}
              className={`flex items-start gap-4 rounded-[16px] border p-4 transition-colors ${
                isNext
                  ? "border-[#6161ff] bg-[#e7ecff]/40"
                  : step.done
                    ? "border-[#d0d4e4] bg-[#f5f6f8]/60"
                    : "border-[#d0d4e4] bg-white"
              }`}
            >
              <StepIndicator done={step.done} optional={step.optional} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`font-medium ${step.done ? "text-[#535768] line-through" : "text-[#333333]"}`}
                  >
                    {step.title}
                  </p>
                  {step.optional ? (
                    <span className="rounded-full bg-[#f5f6f8] px-2 py-0.5 text-xs text-[#535768]">
                      Optional
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-[#535768]">{step.description}</p>
              </div>
              {!step.done && isNext ? (
                <Link href={step.href} className="shrink-0">
                  <Button className="whitespace-nowrap">{step.cta}</Button>
                </Link>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
