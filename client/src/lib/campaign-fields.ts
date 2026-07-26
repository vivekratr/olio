import type { Campaign, CampaignFormValues, CreateCampaignInput } from "@/types/campaign.types";

export const inputClassName =
  "w-full rounded-[16px] border border-[#d0d4e4] bg-white px-4 py-3 text-[#333333] outline-none transition-colors focus:border-[#6161ff]";

export function campaignAsDuplicate(source: Campaign): Campaign {
  return {
    ...source,
    id: "",
    name: `${source.name} (copy)`,
    status: "draft",
    scheduledAt: null,
  };
}

export function campaignToFormDefaults(campaign?: Campaign): CampaignFormValues {
  return {
    name: campaign?.name ?? "",
    subject: campaign?.subject ?? "",
    fromName: "",
    replyTo: "",
    bodyHtml: campaign?.bodyHtml ?? "<p>Hello,</p>\n",
    recipientMode: campaign?.recipientMode ?? "audience",
    audienceId: campaign?.audienceId ?? "",
    tagId: campaign?.tagId ?? "",
    pastedRecipients: campaign?.pastedRecipients?.join("\n") ?? "",
  };
}

export function formValuesToInput(
  values: CampaignFormValues,
  options?: { requireRecipients?: boolean },
): CreateCampaignInput {
  const input: CreateCampaignInput = {
    name: values.name.trim(),
    subject: values.subject.trim(),
    bodyHtml: values.bodyHtml,
    recipientMode: values.recipientMode,
  };

  if (values.recipientMode === "audience" && values.audienceId) {
    input.audienceId = values.audienceId;
  }
  if (values.recipientMode === "tag" && values.tagId) {
    input.tagId = values.tagId;
  }
  if (values.recipientMode === "paste") {
    const pasted = (values.pastedRecipients ?? "")
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (pasted.length > 0 || options?.requireRecipients) {
      input.pastedRecipients = pasted;
    }
  }

  return input;
}

export function formatScheduledAt(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function toLocalDatetimeValue(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultScheduleValue(): string {
  const next = new Date(Date.now() + 60 * 60 * 1000);
  next.setSeconds(0, 0);
  return toLocalDatetimeValue(next);
}
