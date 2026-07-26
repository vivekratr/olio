"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLayout } from "@/components/ui/PageLayout";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";
import { useCampaigns } from "@/hooks/useCampaigns";
import { formatScheduledAt } from "@/lib/campaign-fields";
import { useToast } from "@/providers/ToastProvider";
import type { Campaign, CampaignStatus } from "@/types/campaign.types";

const STATUS_STYLES: Record<
  CampaignStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-[#dbdbff] text-[#333333]",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-[#abf0ff] text-[#333333]",
  },
  sending: {
    label: "Sending",
    className: "bg-[#eddff7] text-[#333333]",
  },
  sent: {
    label: "Sent",
    className: "bg-[#bcfe90] text-[#333333]",
  },
  failed: {
    label: "Failed",
    className: "bg-[#fcd0f8] text-[#333333]",
  },
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}

function TableSkeletonLoader() {
  return <TableSkeleton rows={5} columns={5} label="Loading campaigns" />;
}

function CampaignRow({
  campaign,
  onDelete,
}: {
  campaign: Campaign;
  onDelete: (campaign: Campaign) => void;
}) {
  const isDraft = campaign.status === "draft";
  const canAnalytics =
    campaign.status === "sent" ||
    campaign.status === "sending" ||
    campaign.status === "scheduled" ||
    campaign.status === "failed";

  return (
    <tr className="border-t border-[#d0d4e4] motion-safe:animate-[fadeUp_0.4s_ease-out]">
      <td className="px-4 py-4">
        <div className="font-medium text-[#333333]">{campaign.name}</div>
        <div className="mt-1 text-sm text-[#535768]">{campaign.subject}</div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={campaign.status} />
      </td>
      <td className="px-4 py-4 text-sm text-[#535768]">
        {formatScheduledAt(campaign.scheduledAt)}
      </td>
      <td className="px-4 py-4 text-sm text-[#535768]">
        {new Date(campaign.updatedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {isDraft ? (
            <>
              <Link href={`/campaigns/${campaign.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
              <Button variant="destructive" onClick={() => onDelete(campaign)}>
                Delete
              </Button>
            </>
          ) : (
            <Link href={`/campaigns/${campaign.id}`}>
              <Button variant="outline">View</Button>
            </Link>
          )}
          {canAnalytics ? (
            <Link href={`/campaigns/${campaign.id}/analytics`}>
              <Button>Analytics</Button>
            </Link>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    campaigns,
    loading,
    error,
    refetch,
    isFetching,
    deleteCampaign,
    deleting,
  } = useCampaigns();

  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(
    null,
  );

  const handleDelete = async () => {
    if (!deletingCampaign) {
      return;
    }

    try {
      await deleteCampaign(deletingCampaign.id);
      setDeletingCampaign(null);
      toast("Campaign deleted", "success");
    } catch (deleteError) {
      toast(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete campaign.",
        "error",
      );
    }
  };

  return (
    <PageLayout
      eyebrow="Email marketing"
      title="Campaigns"
      headerAction={
        <Button onClick={() => router.push("/campaigns/new")}>
          Create campaign
        </Button>
      }
    >
      {error ? (
        <ErrorState
          message={error.message}
          onRetry={() => refetch()}
          retryLoading={isFetching}
        />
      ) : loading ? (
        <TableSkeletonLoader />
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Campaigns are the emails you send to your contacts."
          steps={[
            "Write a subject line and email body",
            "Choose recipients from an audience, tag, or pasted emails",
            "Send immediately or schedule for later",
          ]}
          action={
            <Button onClick={() => router.push("/campaigns/new")}>
              Create campaign
            </Button>
          }
          hint="Add contacts and optionally build an audience first."
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-[#d0d4e4] bg-white shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f5f6f8] text-[#535768]">
                <tr>
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <CampaignRow
                    key={campaign.id}
                    campaign={campaign}
                    onDelete={setDeletingCampaign}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingCampaign)}
        title="Delete draft?"
        description={
          deletingCampaign
            ? `Remove "${deletingCampaign.name}" permanently.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCampaign(null)}
      />
    </PageLayout>
  );
}
