import type { Campaign } from "../../generated/prisma/client.js";

export const MAX_CAMPAIGN_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export interface CampaignAttachment {
  name: string;
  content: string;
}

export interface CampaignAttachmentMeta {
  name: string;
}

export function parseCampaignAttachment(
  value: unknown,
): CampaignAttachment | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.name !== "string" || typeof record.content !== "string") {
    return null;
  }

  return { name: record.name, content: record.content };
}

export function toCampaignAttachmentMeta(
  attachment: CampaignAttachment | null,
): CampaignAttachmentMeta | null {
  if (!attachment) {
    return null;
  }

  return { name: attachment.name };
}

export function isCampaignEditable(campaign: Campaign): boolean {
  return campaign.status === "draft" || campaign.status === "scheduled";
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const parsed = parseCampaignAttachment({
    name: "brochure.pdf",
    content: "dGVzdA==",
  });
  console.assert(parsed?.name === "brochure.pdf", "parseCampaignAttachment name");
  console.assert(
    toCampaignAttachmentMeta(parsed)?.name === "brochure.pdf",
    "toCampaignAttachmentMeta",
  );
  console.assert(parseCampaignAttachment(null) === null, "null attachment");
}
