"use client";

import { useEffect, useRef, useState } from "react";

import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { campaignAsDuplicate } from "@/lib/campaign-fields";
import type { Audience } from "@/types/audience.types";
import type { Campaign, CreateCampaignInput } from "@/types/campaign.types";
import type { Tag } from "@/types/tag.types";

interface DuplicateCampaignDialogProps {
  open: boolean;
  source: Campaign | null;
  audiences: Audience[];
  tags: Tag[];
  saving?: boolean;
  sending?: boolean;
  scheduling?: boolean;
  apiError?: string | null;
  onClose: () => void;
  onSaveDraft: (input: CreateCampaignInput) => Promise<Campaign>;
  onSendNow: (input: CreateCampaignInput) => Promise<Campaign>;
  onSendCampaign: (id: string) => Promise<void>;
  onSchedule: (input: CreateCampaignInput) => Promise<Campaign>;
  onScheduleCampaign: (id: string, scheduledAt: string) => Promise<void>;
}

export function DuplicateCampaignDialog({
  open,
  source,
  audiences,
  tags,
  saving = false,
  sending = false,
  scheduling = false,
  apiError = null,
  onClose,
  onSaveDraft,
  onSendNow,
  onSendCampaign,
  onSchedule,
  onScheduleCampaign,
}: DuplicateCampaignDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [duplicateKey, setDuplicateKey] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      setDuplicateKey((key) => key + 1);
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }
    if (dialog.open) {
      dialog.close();
    }
  }, [open, source?.id]);

  const duplicateCampaign = source ? campaignAsDuplicate(source) : undefined;

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[24px] border border-[#d0d4e4] bg-white p-6 text-[#333333] shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <DialogHeader
        title={source ? `Duplicate "${source.name}"` : "Duplicate campaign"}
        onClose={onClose}
        disabled={saving || sending || scheduling}
      >
        <p className="mt-2 text-sm text-[#535768]">
          Content and recipients are copied into a new draft. Pick a new schedule
          time if you schedule the send.
        </p>
      </DialogHeader>

      {duplicateCampaign ? (
        <div className="mt-6" key={duplicateKey}>
          <CampaignForm
            campaign={duplicateCampaign}
            copyAttachmentFromId={
              source?.attachment && source.id ? source.id : undefined
            }
            audiences={audiences}
            tags={tags}
            saving={saving}
            sending={sending}
            scheduling={scheduling}
            apiError={apiError}
            onSaveDraft={onSaveDraft}
            onSendNow={onSendNow}
            onSendCampaign={onSendCampaign}
            onSchedule={onSchedule}
            onScheduleCampaign={onScheduleCampaign}
          />
        </div>
      ) : null}
    </dialog>
  );
}
