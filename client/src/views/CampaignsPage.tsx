"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { DuplicateCampaignDialog } from "@/components/campaigns/DuplicateCampaignDialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLayout } from "@/components/ui/PageLayout";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";
import { useAudiences } from "@/hooks/useAudiences";
import { prepareCampaignAnalyticsView, useCampaigns } from "@/hooks/useCampaigns";
import { useTags } from "@/hooks/useTags";
import { formatScheduledAt } from "@/lib/campaign-fields";
import { useToast } from "@/providers/ToastProvider";
import type { Campaign, CampaignStatus, CreateCampaignInput } from "@/types/campaign.types";

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
  onDuplicate,
}: {
  campaign: Campaign;
  onDelete: (campaign: Campaign) => void;
  onDuplicate: (campaign: Campaign) => void;
}) {
  const isDraft = campaign.status === "draft";
  const canEdit = isDraft || campaign.status === "scheduled";
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
          <Button variant="outline" onClick={() => onDuplicate(campaign)}>
            Duplicate
          </Button>
          {canEdit ? (
            <>
              <Link href={`/campaigns/${campaign.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
              {isDraft ? (
                <Button variant="destructive" onClick={() => onDelete(campaign)}>
                  Delete
                </Button>
              ) : null}
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { audiences } = useAudiences();
  const { tags } = useTags();
  const {
    campaigns,
    loading,
    error,
    refetch,
    isFetching,
    createCampaign,
    sendCampaign,
    scheduleCampaign,
    deleteCampaign,
    creating,
    sending,
    scheduling,
    deleting,
  } = useCampaigns();

  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(
    null,
  );
  const [duplicatingCampaign, setDuplicatingCampaign] = useState<Campaign | null>(
    null,
  );
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const closeDuplicate = () => {
    setDuplicatingCampaign(null);
    setDuplicateError(null);
  };

  const handleDuplicateSaveDraft = async (input: CreateCampaignInput) => {
    setDuplicateError(null);
    try {
      const created = await createCampaign(input);
      closeDuplicate();
      toast("Draft created from duplicate", "success");
      router.push(`/campaigns/${created.id}`);
      return created;
    } catch (saveError) {
      setDuplicateError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save duplicate.",
      );
      throw saveError;
    }
  };

  const handleDuplicateSendNow = async (input: CreateCampaignInput) => {
    setDuplicateError(null);
    try {
      return await createCampaign(input);
    } catch (sendError) {
      setDuplicateError(
        sendError instanceof Error
          ? sendError.message
          : "Could not save duplicate.",
      );
      throw sendError;
    }
  };

  const handleDuplicateSendCampaign = async (id: string) => {
    setDuplicateError(null);
    try {
      const sending = await sendCampaign(id);
      await prepareCampaignAnalyticsView(queryClient, sending);
      closeDuplicate();
      toast("Campaign is sending", "success");
      router.push(`/campaigns/${sending.id}/analytics`);
    } catch (sendError) {
      setDuplicateError(
        sendError instanceof Error
          ? sendError.message
          : "Could not send duplicate.",
      );
      throw sendError;
    }
  };

  const handleDuplicateSchedule = async (input: CreateCampaignInput) => {
    setDuplicateError(null);
    try {
      return await createCampaign(input);
    } catch (scheduleError) {
      setDuplicateError(
        scheduleError instanceof Error
          ? scheduleError.message
          : "Could not save duplicate.",
      );
      throw scheduleError;
    }
  };

  const handleDuplicateScheduleCampaign = async (
    id: string,
    scheduledAt: string,
  ) => {
    setDuplicateError(null);
    try {
      await scheduleCampaign({ id, input: { scheduledAt } });
      closeDuplicate();
      toast("Campaign scheduled", "success");
      router.push("/campaigns");
    } catch (scheduleError) {
      setDuplicateError(
        scheduleError instanceof Error
          ? scheduleError.message
          : "Could not schedule duplicate.",
      );
      throw scheduleError;
    }
  };

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
                    onDuplicate={setDuplicatingCampaign}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DuplicateCampaignDialog
        open={Boolean(duplicatingCampaign)}
        source={duplicatingCampaign}
        audiences={audiences}
        tags={tags}
        saving={creating}
        sending={sending}
        scheduling={scheduling}
        apiError={duplicateError}
        onClose={closeDuplicate}
        onSaveDraft={handleDuplicateSaveDraft}
        onSendNow={handleDuplicateSendNow}
        onSendCampaign={handleDuplicateSendCampaign}
        onSchedule={handleDuplicateSchedule}
        onScheduleCampaign={handleDuplicateScheduleCampaign}
      />

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
