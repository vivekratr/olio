"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { Select } from "@/components/ui/Select";
import {
  campaignToFormDefaults,
  defaultScheduleValue,
  formValuesToInput,
  inputClassName,
  toLocalDatetimeValue,
} from "@/lib/campaign-fields";
import { previewCampaignRecipients } from "@/services/campaign.service";
import {
  campaignDraftSchema,
  campaignFormSchema,
} from "@/schemas/campaign.schema";
import type { Audience } from "@/types/audience.types";
import type { Campaign, CampaignFormValues, PreviewRecipientsResponse, RecipientMode } from "@/types/campaign.types";
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

interface CampaignFormProps {
  campaign?: Campaign;
  audiences: Audience[];
  tags: Tag[];
  readOnly?: boolean;
  saving?: boolean;
  sending?: boolean;
  scheduling?: boolean;
  apiError?: string | null;
  onSaveDraft: (input: ReturnType<typeof formValuesToInput>) => Promise<void>;
  onSendNow?: (input: ReturnType<typeof formValuesToInput>) => Promise<void>;
  onSchedule?: (
    input: ReturnType<typeof formValuesToInput>,
    scheduledAt: string,
  ) => Promise<void>;
}

export function CampaignForm({
  campaign,
  audiences,
  tags,
  readOnly = false,
  saving = false,
  sending = false,
  scheduling = false,
  apiError = null,
  onSaveDraft,
  onSendNow,
  onSchedule,
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
  const scheduleDialogRef = useRef<HTMLDialogElement>(null);

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
  const pastedRecipients = watch("pastedRecipients");
  const bodyHtml = watch("bodyHtml");

  useEffect(() => {
    if (recipientMode !== "paste") {
      setPastePreview(null);
      setPastePreviewError(null);
      return;
    }

    const pasted = (pastedRecipients ?? "")
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (pasted.length === 0) {
      setPastePreview(null);
      setPastePreviewError(null);
      return;
    }

    setPastePreviewLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await previewCampaignRecipients({
          recipientMode: "paste",
          pasted,
        });
        setPastePreview(result);
        setPastePreviewError(null);
      } catch (error) {
        setPastePreview(null);
        setPastePreviewError(
          error instanceof Error ? error.message : "Preview failed.",
        );
      } finally {
        setPastePreviewLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [recipientMode, pastedRecipients]);

  useEffect(() => {
    reset(campaignToFormDefaults(campaign));
  }, [campaign, reset]);

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
    handler: (input: ReturnType<typeof formValuesToInput>) => Promise<void>,
    requireRecipients: boolean,
  ) => {
    setActionError(null);
    const values = watch();

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setActionError(first?.message ?? "Please fix the highlighted fields.");
      return;
    }

    try {
      await handler(
        formValuesToInput(parsed.data, { requireRecipients }),
      );
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
      await onSaveDraft(formValuesToInput(values));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not save draft.",
      );
    }
  });

  const confirmSend = async () => {
    if (!onSendNow) {
      return;
    }

    await runWithValues(campaignFormSchema, onSendNow, true);
    setSendOpen(false);
  };

  const confirmSchedule = async () => {
    if (!onSchedule) {
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

    await runWithValues(
      campaignFormSchema,
      (input) => onSchedule(input, scheduledDate.toISOString()),
      true,
    );
    setScheduleOpen(false);
  };

  const disabled = readOnly || saving || sending || scheduling || isSubmitting;
  const showActions = !readOnly && campaign?.status !== "scheduled";
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
                <div className="mt-3 rounded-[16px] border border-[#d0d4e4] bg-[#f5f6f8] p-4">
                  <p className="text-sm font-medium text-[#333333]">Recipient preview</p>
                  {pastePreviewLoading ? (
                    <p className="mt-2 text-sm text-[#535768]">Checking contacts…</p>
                  ) : pastePreviewError ? (
                    <p className="mt-2 text-sm text-[#e44258]">{pastePreviewError}</p>
                  ) : pastePreview ? (
                    <div className="mt-2 space-y-3 text-sm">
                      <div className="space-y-1 text-[#535768]">
                        <p>
                          Matched contacts:{" "}
                          <span className="font-medium text-[#333333]">
                            {pastePreview.totalMatched}
                          </span>
                        </p>
                        <p>
                          Unmatched entries:{" "}
                          <span className="font-medium text-[#333333]">
                            {pastePreview.totalUnmatched}
                          </span>
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {pastePreview.matched.slice(0, 8).map((contact) => (
                          <li key={contact.id} className="text-[#333333]">
                            <span aria-hidden className="text-[#2a5c4e]">
                              ✓{" "}
                            </span>
                            {formatMatchedContact(contact)}
                          </li>
                        ))}
                        {pastePreview.matched.length > 8 ? (
                          <li className="text-[#535768]">
                            +{pastePreview.matched.length - 8} more matched
                          </li>
                        ) : null}
                        {pastePreview.unmatched.slice(0, 8).map((value) => (
                          <li key={value} className="text-[#e44258]">
                            <span aria-hidden>✗ </span>
                            {value} — {UNMATCHED_REASON}
                          </li>
                        ))}
                        {pastePreview.unmatched.length > 8 ? (
                          <li className="text-[#e44258]">
                            +{pastePreview.unmatched.length - 8} more unmatched
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[#535768]">
                      Paste emails or phones to preview matches.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
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
            Save draft
          </Button>
          {onSchedule ? (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                setActionError(null);
                setScheduleAt(defaultScheduleValue());
                setScheduleOpen(true);
              }}
            >
              Schedule
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
        loading={sending}
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
          title="Schedule campaign"
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
          <Button type="button" loading={scheduling} onClick={confirmSchedule}>
            Schedule send
          </Button>
        </div>
      </dialog>
    </form>
  );
}
