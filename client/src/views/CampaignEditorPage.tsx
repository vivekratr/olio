"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLayout } from "@/components/ui/PageLayout";
import { FormSkeleton } from "@/components/ui/skeletons/FormSkeleton";
import { useAudiences } from "@/hooks/useAudiences";
import {
  prepareCampaignAnalyticsView,
  useCampaign,
  useCampaigns,
} from "@/hooks/useCampaigns";
import { useQueryClient } from "@tanstack/react-query";
import { useTags } from "@/hooks/useTags";
import { formatScheduledAt } from "@/lib/campaign-fields";
import type { CreateCampaignInput } from "@/types/campaign.types";
import { useToast } from "@/providers/ToastProvider";

interface CampaignEditorPageProps {
  campaignId?: string;
}

export function CampaignEditorPage({ campaignId }: CampaignEditorPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isCreate = !campaignId;

  const { audiences } = useAudiences();
  const { tags } = useTags();
  const {
    campaign,
    loading: loadingCampaign,
    error: loadError,
    refetch,
    isFetching,
  } = useCampaign(campaignId);

  const {
    createCampaign,
    updateCampaign,
    sendCampaign,
    scheduleCampaign,
    creating,
    updating,
    sending,
    scheduling,
  } = useCampaigns();

  const [apiError, setApiError] = useState<string | null>(null);

  const isDraft = isCreate || campaign?.status === "draft";
  const isScheduled = campaign?.status === "scheduled";
  const isEditable = isDraft || isScheduled;
  const title = isCreate
    ? "Create campaign"
    : campaign?.name ?? "Campaign";

  const persist = async (input: CreateCampaignInput) => {
    if (isCreate) {
      const created = await createCampaign(input);
      return created;
    }

    if (!campaignId) {
      throw new Error("Campaign not found.");
    }

    return updateCampaign({ id: campaignId, input });
  };

  const handleSaveDraft = async (input: CreateCampaignInput) => {
    setApiError(null);
    try {
      const saved = await persist(input);
      toast(isScheduled ? "Changes saved" : "Draft saved", "success");
      if (isCreate) {
        router.replace(`/campaigns/${saved.id}`);
      }
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Could not save draft.",
      );
      throw error;
    }
  };

  const handleSendNow = async (input: CreateCampaignInput) => {
    setApiError(null);
    try {
      const saved = await persist(input);
      const sending = await sendCampaign(saved.id);
      await prepareCampaignAnalyticsView(queryClient, sending);
      toast("Campaign is sending", "success");
      router.push(`/campaigns/${sending.id}/analytics`);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Could not send campaign.",
      );
      throw error;
    }
  };

  const handleSchedule = async (
    input: CreateCampaignInput,
    scheduledAt: string,
  ) => {
    setApiError(null);
    try {
      const saved = await persist(input);
      await scheduleCampaign({ id: saved.id, input: { scheduledAt } });
      toast(isScheduled ? "Campaign rescheduled" : "Campaign scheduled", "success");
      router.push("/campaigns");
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Could not schedule campaign.",
      );
      throw error;
    }
  };

  if (!isCreate && loadError) {
    return (
      <PageLayout eyebrow="Campaigns" title="Campaign">
        <ErrorState
          message={loadError.message}
          onRetry={() => refetch()}
          retryLoading={isFetching}
        />
      </PageLayout>
    );
  }

  if (!isCreate && loadingCampaign) {
    return (
      <PageLayout eyebrow="Campaigns">
        <FormSkeleton />
      </PageLayout>
    );
  }

  if (!isCreate && !campaign) {
    return (
      <PageLayout eyebrow="Campaigns" title="Campaign">
        <ErrorState message="Campaign not found." />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      eyebrow="Campaigns"
      title={title}
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Link href="/campaigns">
            <Button variant="outline">Back to list</Button>
          </Link>
          {!isCreate && campaign ? (
            <Link href={`/campaigns/${campaign.id}/analytics`}>
              <Button variant="outline">Analytics</Button>
            </Link>
          ) : null}
        </div>
      }
    >
      {!isCreate && campaign && !isEditable ? (
        <p className="mb-6 rounded-[16px] border border-[#d0d4e4] bg-[#f5f6f8] px-4 py-3 text-sm text-[#535768]">
          This campaign is <strong className="text-[#333333]">{campaign.status}</strong>{" "}
          and can no longer be edited.
        </p>
      ) : null}

      {isScheduled && campaign ? (
        <p className="mb-6 rounded-[16px] border border-[#abf0ff] bg-[#abf0ff]/30 px-4 py-3 text-sm text-[#535768]">
          Scheduled for{" "}
          <strong className="text-[#333333]">
            {formatScheduledAt(campaign.scheduledAt)}
          </strong>
          . Save changes or pick a new send time.
        </p>
      ) : null}

      <CampaignForm
        campaign={campaign}
        audiences={audiences}
        tags={tags}
        readOnly={!isEditable}
        saving={creating || updating}
        sending={sending}
        scheduling={scheduling}
        apiError={apiError}
        onSaveDraft={handleSaveDraft}
        onSendNow={isDraft && !isScheduled ? handleSendNow : undefined}
        onSchedule={isEditable ? handleSchedule : undefined}
      />
    </PageLayout>
  );
}
