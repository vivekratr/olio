"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { Select } from "@/components/ui/Select";
import { CampaignRecipientsTable } from "@/components/campaigns/CampaignRecipientsTable";
import {
  campaignToFormDefaults,
  defaultScheduleValue,
  formValuesToInput,
  inputClassName,
  toLocalDatetimeValue,
} from "@/lib/campaign-fields";
import { previewCampaignRecipients, removeCampaignAttachment, uploadCampaignAttachment } from "@/services/campaign.service";
import {
  campaignDraftSchema,
  campaignFormSchema,
} from "@/schemas/campaign.schema";
import type { Audience } from "@/types/audience.types";
import type { Campaign, CampaignFormValues, CreateCampaignInput, PreviewRecipientsResponse, RecipientMode } from "@/types/campaign.types";
import type { Tag } from "@/types/tag.types";

type EditorTab = "compose" | "preview";

const UNMATCHED_REASON =
  "Contact not found. This address will not receive the campaign.";

function formatMatchedContact(
  contact: PreviewRecipientsResponse["matched"][number],
): string {
  const handle = contact.email || contact.phone || contact.id;
  return contact.name ? `${contact.name} <${handle}>` : handle;
}

function recipientConfirmMessage(
  mode: RecipientMode,
  preview: PreviewRecipientsResponse | null,
  action: "send" | "schedule",
): string {
  if (mode !== "paste" || !preview) {
    return action === "send"
      ? "This will queue the campaign for immediate delivery to all matched recipients."
      : "";
  }

  const { totalMatched, totalUnmatched } = preview;
  const matchedLabel = `${totalMatched} matched contact${totalMatched === 1 ? "" : "s"}`;
  let message = `Campaign will be ${action === "send" ? "sent to" : "scheduled for"} ${matchedLabel}.`;

  if (totalUnmatched > 0) {
    message += ` ${totalUnmatched} unmatched entr${totalUnmatched === 1 ? "y" : "ies"} will be ignored.`;
  }

  return message;
}

function toPreviewSrcDoc(html: string): string {
  const body = html.trim() || "<p></p>";
  if (/^\s*<(!DOCTYPE|html)/i.test(body)) {
    return body;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:24px;}</style></head><body>${body}</body></html>`;
}

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

interface CampaignFormProps {
  campaign?: Campaign;
  campaignId?: string;
  copyAttachmentFromId?: string;
  audiences: Audience[];
  tags: Tag[];
  readOnly?: boolean;
  saving?: boolean;
  sending?: boolean;
  scheduling?: boolean;
  apiError?: string | null;
  onAttachmentChange?: () => void;
  onSaveDraft: (input: CreateCampaignInput) => Promise<Campaign>;
  onSendNow?: (input: CreateCampaignInput) => Promise<Campaign>;
  onSendCampaign?: (id: string) => Promise<void>;
  onSchedule?: (input: CreateCampaignInput) => Promise<Campaign>;
  onScheduleCampaign?: (id: string, scheduledAt: string) => Promise<void>;
}

export function CampaignForm({
  campaign,
  campaignId,
  copyAttachmentFromId,
  audiences,
  tags,
  readOnly = false,
  saving = false,
  sending = false,
  scheduling = false,
  apiError = null,
  onAttachmentChange,
  onSaveDraft,
  onSendNow,
  onSendCampaign,
  onSchedule,
  onScheduleCampaign,
}: CampaignFormProps) {
  const [tab, setTab] = useState<EditorTab>("compose");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(defaultScheduleValue);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pastePreview, setPastePreview] = useState<PreviewRecipientsResponse | null>(
    null,
  );
  const [pastePreviewLoading, setPastePreviewLoading] = useState(false);
  const [pastePreviewError, setPastePreviewError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [sendActionLoading, setSendActionLoading] = useState(false);
  const [scheduleActionLoading, setScheduleActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scheduleDialogRef = useRef<HTMLDialogElement>(null);
  const resolvedCampaignId = campaignId ?? campaign?.id;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignDraftSchema),
    defaultValues: campaignToFormDefaults(campaign),
  });

  const recipientMode = watch("recipientMode");
  const audienceId = watch("audienceId");
  const tagId = watch("tagId");
  const pastedRecipients = watch("pastedRecipients");
  const bodyHtml = watch("bodyHtml");

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async () => {
      if (recipientMode === "audience" && !audienceId) {
        setPastePreview(null);
        setPastePreviewError(null);
        return;
      }

      if (recipientMode === "tag" && !tagId) {
        setPastePreview(null);
        setPastePreviewError(null);
        return;
      }

      const pasted =
        recipientMode === "paste"
          ? (pastedRecipients ?? "")
              .split(/[\n,;]+/)
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined;

      if (recipientMode === "paste" && (!pasted || pasted.length === 0)) {
        setPastePreview(null);
        setPastePreviewError(null);
        return;
      }

      setPastePreviewLoading(true);
      try {
        const result = await previewCampaignRecipients({
          recipientMode,
          audienceId: recipientMode === "audience" ? audienceId : undefined,
          tagId: recipientMode === "tag" ? tagId : undefined,
          pasted,
        });
        if (!cancelled) {
          setPastePreview(result);
          setPastePreviewError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPastePreview(null);
          setPastePreviewError(
            error instanceof Error ? error.message : "Preview failed.",
          );
        }
      } finally {
        if (!cancelled) {
          setPastePreviewLoading(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      void loadPreview();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [recipientMode, audienceId, tagId, pastedRecipients]);

  useEffect(() => {
    reset(campaignToFormDefaults(campaign));
    setPendingFile(null);
  }, [campaign, reset]);

  const attachmentName = pendingFile?.name ?? campaign?.attachment?.name ?? null;

  const toInputOptions = (requireRecipients: boolean) => ({
    requireRecipients,
    copyAttachmentFromId:
      copyAttachmentFromId && campaign?.attachment ? copyAttachmentFromId : undefined,
  });

  const flushPendingAttachment = async (saved: Campaign) => {
    if (!pendingFile) {
      return saved;
    }

    setAttachmentLoading(true);
    try {
      const updated = await uploadCampaignAttachment(saved.id, pendingFile);
      setPendingFile(null);
      onAttachmentChange?.();
      return updated;
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleAttachmentSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setActionError("Attachment must be 5 MB or smaller.");
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setActionError("Only PDF files are allowed.");
      return;
    }

    setActionError(null);

    if (resolvedCampaignId) {
      setAttachmentLoading(true);
      try {
        await uploadCampaignAttachment(resolvedCampaignId, file);
        onAttachmentChange?.();
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "Could not upload attachment.",
        );
      } finally {
        setAttachmentLoading(false);
      }
      return;
    }

    setPendingFile(file);
  };

  const handleRemoveAttachment = async () => {
    setActionError(null);

    if (pendingFile) {
      setPendingFile(null);
      return;
    }

    if (!resolvedCampaignId || !campaign?.attachment) {
      return;
    }

    setAttachmentLoading(true);
    try {
      await removeCampaignAttachment(resolvedCampaignId);
      onAttachmentChange?.();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not remove attachment.",
      );
    } finally {
      setAttachmentLoading(false);
    }
  };

  useEffect(() => {
    const dialog = scheduleDialogRef.current;
    if (!dialog) {
      return;
    }
    if (scheduleOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }
    if (dialog.open) {
      dialog.close();
    }
  }, [scheduleOpen]);

  const runWithValues = async (
    schema: typeof campaignDraftSchema | typeof campaignFormSchema,
    handler: (input: CreateCampaignInput) => Promise<Campaign>,
    requireRecipients: boolean,
  ): Promise<Campaign> => {
    setActionError(null);
    const values = watch();

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setActionError(first?.message ?? "Please fix the highlighted fields.");
      throw new Error(first?.message ?? "Validation failed.");
    }

    try {
      const saved = await handler(
        formValuesToInput(parsed.data, toInputOptions(requireRecipients)),
      );
      return await flushPendingAttachment(saved);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      throw error;
    }
  };

  const handleSaveDraft = handleSubmit(async (values) => {
    setActionError(null);
    try {
      const saved = await onSaveDraft(
        formValuesToInput(values, toInputOptions(false)),
      );
      await flushPendingAttachment(saved);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not save draft.",
      );
    }
  });

  const confirmSend = async () => {
    if (!onSendNow || !onSendCampaign) {
      return;
    }

    setSendActionLoading(true);
    try {
      const saved = await runWithValues(campaignFormSchema, onSendNow, true);
      await onSendCampaign(saved.id);
      setSendOpen(false);
    } catch {
      // runWithValues and onSendCampaign surface errors via actionError/apiError.
    } finally {
      setSendActionLoading(false);
    }
  };

  const confirmSchedule = async () => {
    if (!onSchedule || !onScheduleCampaign) {
      return;
    }

    if (!scheduleAt.trim()) {
      setActionError("Pick a schedule time.");
      return;
    }

    const scheduledDate = new Date(scheduleAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      setActionError("Pick a valid schedule time.");
      return;
    }
    if (scheduledDate.getTime() <= Date.now()) {
      setActionError("Schedule time must be in the future.");
      return;
    }

    setScheduleActionLoading(true);
    try {
      const saved = await runWithValues(campaignFormSchema, onSchedule, true);
      await onScheduleCampaign(saved.id, scheduledDate.toISOString());
      setScheduleOpen(false);
    } catch {
      // runWithValues and onScheduleCampaign surface errors via actionError/apiError.
    } finally {
      setScheduleActionLoading(false);
    }
  };

  const disabled =
    readOnly ||
    saving ||
    sending ||
    scheduling ||
    isSubmitting ||
    attachmentLoading;
  const isScheduled = campaign?.status === "scheduled";
  const showActions = !readOnly;
  const sendRecipientNote = recipientConfirmMessage(
    recipientMode,
    pastePreview,
    "send",
  );
  const scheduleRecipientNote = recipientConfirmMessage(
    recipientMode,
    pastePreview,
    "schedule",
  );

  return (
    <form className="space-y-8" onSubmit={handleSaveDraft} noValidate>
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-5 rounded-[24px] border border-[#d0d4e4] bg-white p-6 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] motion-safe:animate-[fadeUp_0.45s_ease-out]">
          <div>
            <label htmlFor="campaign-name" className="mb-2 block text-sm font-medium">
              Campaign name
            </label>
            <input
              id="campaign-name"
              className={inputClassName}
              disabled={disabled}
              {...register("name")}
            />
            {errors.name ? (
              <p className="mt-1 text-sm text-[#e44258]">{errors.name.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="campaign-subject" className="mb-2 block text-sm font-medium">
              Subject
            </label>
            <input
              id="campaign-subject"
              className={inputClassName}
              disabled={disabled}
              {...register("subject")}
            />
            {errors.subject ? (
              <p className="mt-1 text-sm text-[#e44258]">{errors.subject.message}</p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="campaign-from" className="mb-2 block text-sm font-medium">
                From name
              </label>
              <input
                id="campaign-from"
                className={inputClassName}
                placeholder="Your brand"
                disabled={disabled}
                {...register("fromName")}
              />
              {errors.fromName ? (
                <p className="mt-1 text-sm text-[#e44258]">{errors.fromName.message}</p>
              ) : (
                <p className="mt-1 text-xs text-[#535768]">
                  Display name for recipients. Delivery uses your workspace sender.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="campaign-reply" className="mb-2 block text-sm font-medium">
                Reply-to email
              </label>
              <input
                id="campaign-reply"
                type="email"
                className={inputClassName}
                placeholder="replies@example.com"
                disabled={disabled}
                {...register("replyTo")}
              />
              {errors.replyTo ? (
                <p className="mt-1 text-sm text-[#e44258]">{errors.replyTo.message}</p>
              ) : null}
            </div>
          </div>

          <fieldset className="space-y-4">
            <legend className="text-sm font-medium">Recipients</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["audience", "Audience"],
                  ["tag", "Tag"],
                  ["paste", "Paste list"],
                ] as const
              ).map(([mode, label]) => (
                <label
                  key={mode}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    recipientMode === mode
                      ? "border-[#6161ff] bg-[#e7ecff] text-[#333333]"
                      : "border-[#d0d4e4] bg-[#f5f6f8] text-[#535768] hover:border-[#6161ff]/40"
                  } ${disabled ? "pointer-events-none opacity-60" : ""}`}
                >
                  <input
                    type="radio"
                    value={mode}
                    className="sr-only"
                    disabled={disabled}
                    {...register("recipientMode")}
                  />
                  {label}
                </label>
              ))}
            </div>

            {recipientMode === "audience" ? (
              <div>
                <label htmlFor="campaign-audience" className="mb-2 block text-sm font-medium">
                  Audience
                </label>
                <Select
                  id="campaign-audience"
                  disabled={disabled}
                  aria-invalid={errors.audienceId ? true : undefined}
                  {...register("audienceId")}
                >
                  <option value="" disabled>
                    Select an audience
                  </option>
                  {audiences.map((audience) => (
                    <option key={audience.id} value={audience.id}>
                      {audience.name}
                    </option>
                  ))}
                </Select>
                {errors.audienceId ? (
                  <p className="mt-1 text-sm text-[#e44258]">
                    {errors.audienceId.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            {recipientMode === "tag" ? (
              <div>
                <label htmlFor="campaign-tag" className="mb-2 block text-sm font-medium">
                  Tag
                </label>
                <Select
                  id="campaign-tag"
                  disabled={disabled}
                  aria-invalid={errors.tagId ? true : undefined}
                  {...register("tagId")}
                >
                  <option value="" disabled>
                    Select a tag
                  </option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </Select>
                {errors.tagId ? (
                  <p className="mt-1 text-sm text-[#e44258]">{errors.tagId.message}</p>
                ) : null}
              </div>
            ) : null}

            {recipientMode === "paste" ? (
              <div>
                <label
                  htmlFor="campaign-paste"
                  className="mb-2 block text-sm font-medium"
                >
                  Emails or phones
                </label>
                <textarea
                  id="campaign-paste"
                  rows={5}
                  className={`${inputClassName} resize-y font-mono text-sm`}
                  placeholder="One per line, or comma-separated"
                  disabled={disabled}
                  {...register("pastedRecipients")}
                />
                {errors.pastedRecipients ? (
                  <p className="mt-1 text-sm text-[#e44258]">
                    {errors.pastedRecipients.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-[16px] border border-[#d0d4e4] bg-[#f5f6f8] p-4">
              <p className="text-sm font-medium text-[#333333]">Recipient preview</p>
              {pastePreviewLoading ? (
                <p className="mt-2 text-sm text-[#535768]">Loading contacts…</p>
              ) : pastePreviewError ? (
                <p className="mt-2 text-sm text-[#e44258]">{pastePreviewError}</p>
              ) : pastePreview ? (
                <div className="mt-3 space-y-3">
                  <div className="space-y-1 text-sm text-[#535768]">
                    <p>
                      Matched contacts:{" "}
                      <span className="font-medium text-[#333333]">
                        {pastePreview.totalMatched}
                      </span>
                    </p>
                    {recipientMode === "paste" ? (
                      <p>
                        Unmatched entries:{" "}
                        <span className="font-medium text-[#333333]">
                          {pastePreview.totalUnmatched}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <CampaignRecipientsTable
                    recipients={pastePreview.matched.map((contact) => ({
                      id: contact.id,
                      name: contact.name,
                      email: contact.email,
                      phone: contact.phone,
                    }))}
                    unmatched={recipientMode === "paste" ? pastePreview.unmatched : []}
                    emptyMessage="No matched contacts for this selection."
                  />
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#535768]">
                  {recipientMode === "paste"
                    ? "Paste emails or phones to preview matches."
                    : recipientMode === "audience"
                      ? "Select an audience to preview contacts."
                      : "Select a tag to preview contacts."}
                </p>
              )}
            </div>
          </fieldset>
        </section>

        <section className="min-w-0 space-y-4 motion-safe:animate-[fadeUp_0.55s_ease-out]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-[#535768]">
              Email content
            </h2>
            <div className="flex rounded-full border border-[#d0d4e4] bg-[#f5f6f8] p-1">
              {(
                [
                  ["compose", "HTML"],
                  ["preview", "Preview"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`btn-interactive rounded-full px-4 py-1.5 text-sm font-medium ${
                    tab === value
                      ? "bg-white text-[#333333] shadow-sm"
                      : "text-[#535768] hover:bg-white/70 hover:text-[#333333]"
                  }`}
                  onClick={() => setTab(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {tab === "compose" ? (
            <textarea
              id="campaign-body"
              rows={18}
              className={`${inputClassName} min-h-[420px] resize-y font-mono text-sm leading-relaxed`}
              disabled={disabled}
              spellCheck={false}
              {...register("bodyHtml")}
            />
          ) : (
            <iframe
              title="Email preview"
              className="min-h-[420px] w-full min-w-0 rounded-[24px] border border-[#d0d4e4] bg-white shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]"
              sandbox=""
              srcDoc={toPreviewSrcDoc(bodyHtml ?? "")}
            />
          )}
          {errors.bodyHtml ? (
            <p className="text-sm text-[#e44258]">{errors.bodyHtml.message}</p>
          ) : null}

          <div className="rounded-[16px] border border-[#d0d4e4] bg-[#f5f6f8] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#333333]">Email attachment</p>
                <p className="mt-1 text-xs text-[#535768]">PDF only, up to 5 MB.</p>
              </div>
              {!readOnly ? (
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                    disabled={disabled}
                    onChange={handleAttachmentSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {attachmentName ? "Replace PDF" : "Attach PDF"}
                  </Button>
                  {attachmentName ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      onClick={handleRemoveAttachment}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {attachmentName ? (
              <p className="mt-3 text-sm text-[#333333]">
                {attachmentName}
                {pendingFile && !resolvedCampaignId ? (
                  <span className="text-[#535768]"> — uploads when you save or send</span>
                ) : null}
              </p>
            ) : (
              <p className="mt-3 text-sm text-[#535768]">No attachment.</p>
            )}
          </div>
        </section>
      </div>

      {apiError || actionError ? (
        <p role="alert" className="text-sm text-[#e44258]">
          {apiError ?? actionError}
        </p>
      ) : null}

      {showActions ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#d0d4e4] pt-6">
          <Button type="submit" variant="outline" loading={saving} disabled={disabled}>
            {isScheduled ? "Save changes" : "Save draft"}
          </Button>
          {onSchedule ? (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                setActionError(null);
                setScheduleAt(
                  campaign?.scheduledAt
                    ? toLocalDatetimeValue(new Date(campaign.scheduledAt))
                    : defaultScheduleValue(),
                );
                setScheduleOpen(true);
              }}
            >
              {isScheduled ? "Reschedule" : "Schedule"}
            </Button>
          ) : null}
          {onSendNow ? (
            <Button
              type="button"
              disabled={disabled}
              onClick={() => {
                setActionError(null);
                setSendOpen(true);
              }}
            >
              Send now
            </Button>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={sendOpen}
        title="Send campaign now?"
        description={sendRecipientNote}
        confirmLabel="Send now"
        loading={sendActionLoading || sending}
        onConfirm={confirmSend}
        onCancel={() => setSendOpen(false)}
      />

      <dialog
        ref={scheduleDialogRef}
        className="w-full max-w-md rounded-[24px] border border-[#d0d4e4] bg-white p-6 text-[#333333] shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
        onCancel={(event) => {
          event.preventDefault();
          setScheduleOpen(false);
        }}
        onClose={() => setScheduleOpen(false)}
      >
        <DialogHeader
          title={isScheduled ? "Reschedule campaign" : "Schedule campaign"}
          onClose={() => setScheduleOpen(false)}
          disabled={scheduling}
        >
          <p className="mt-2 text-sm text-[#535768]">
            Pick a future date and time. Sends are queued and survive server restarts.
          </p>
          {scheduleRecipientNote ? (
            <p className="mt-2 text-sm text-[#535768]">{scheduleRecipientNote}</p>
          ) : null}
        </DialogHeader>
        <label htmlFor="schedule-at" className="mt-6 block text-sm font-medium">
          Send at
        </label>
        <input
          id="schedule-at"
          type="datetime-local"
          required
          className={`${inputClassName} mt-2`}
          value={scheduleAt}
          min={toLocalDatetimeValue(new Date())}
          onChange={(event) => setScheduleAt(event.target.value)}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            loading={scheduleActionLoading || scheduling}
            onClick={confirmSchedule}
          >
            {isScheduled ? "Save new time" : "Schedule send"}
          </Button>
        </div>
      </dialog>
    </form>
  );
}
