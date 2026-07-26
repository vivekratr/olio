"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
import type { Campaign, CampaignFormValues, PreviewRecipientsResponse } from "@/types/campaign.types";
import type { Tag } from "@/types/tag.types";

type EditorTab = "compose" | "preview";

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

  return (
    <form className="space-y-8" onSubmit={handleSaveDraft} noValidate>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="space-y-5 rounded-[24px] border border-[#d0d4e4] bg-white p-6 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] motion-safe:animate-[fadeUp_0.45s_ease-out]">
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
                <select
                  id="campaign-audience"
                  className={inputClassName}
                  disabled={disabled}
                  {...register("audienceId")}
                >
                  <option value="">Select an audience</option>
                  {audiences.map((audience) => (
                    <option key={audience.id} value={audience.id}>
                      {audience.name}
                    </option>
                  ))}
                </select>
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
                <select
                  id="campaign-tag"
                  className={inputClassName}
                  disabled={disabled}
                  {...register("tagId")}
                >
                  <option value="">Select a tag</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
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
                      <p className="text-[#535768]">
                        {pastePreview.totalMatched} matched
                        {pastePreview.totalUnmatched > 0
                          ? `, ${pastePreview.totalUnmatched} unmatched`
                          : ""}
                      </p>
                      {pastePreview.matched.length > 0 ? (
                        <ul className="space-y-1 text-[#333333]">
                          {pastePreview.matched.slice(0, 8).map((contact) => (
                            <li key={contact.id}>
                              {contact.name || contact.email || contact.phone}
                            </li>
                          ))}
                          {pastePreview.matched.length > 8 ? (
                            <li className="text-[#535768]">
                              +{pastePreview.matched.length - 8} more matched
                            </li>
                          ) : null}
                        </ul>
                      ) : null}
                      {pastePreview.unmatched.length > 0 ? (
                        <div>
                          <p className="font-medium text-[#e44258]">Unmatched</p>
                          <ul className="mt-1 space-y-1 text-[#e44258]">
                            {pastePreview.unmatched.slice(0, 8).map((value) => (
                              <li key={value}>{value}</li>
                            ))}
                            {pastePreview.unmatched.length > 8 ? (
                              <li>+{pastePreview.unmatched.length - 8} more</li>
                            ) : null}
                          </ul>
                        </div>
                      ) : null}
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

        <section className="space-y-4 motion-safe:animate-[fadeUp_0.55s_ease-out]">
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
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    tab === value
                      ? "bg-white text-[#333333] shadow-sm"
                      : "text-[#535768] hover:text-[#333333]"
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
            <div
              className="min-h-[420px] overflow-auto rounded-[24px] border border-[#d0d4e4] bg-white p-6 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]"
              dangerouslySetInnerHTML={{ __html: bodyHtml || "<p></p>" }}
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
        description="This will queue the campaign for immediate delivery to all matched recipients."
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
        <h2 className="text-xl font-medium">Schedule campaign</h2>
        <p className="mt-2 text-sm text-[#535768]">
          Pick a future date and time. Sends are queued and survive server restarts.
        </p>
        <label htmlFor="schedule-at" className="mt-6 block text-sm font-medium">
          Send at
        </label>
        <input
          id="schedule-at"
          type="datetime-local"
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
