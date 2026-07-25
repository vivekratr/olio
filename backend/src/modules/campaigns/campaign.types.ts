import type { ContactResponse } from "../contacts/contact.types.js";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed";

export type RecipientMode = "audience" | "tag" | "paste";

export interface CampaignResponse {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  recipientMode: RecipientMode;
  status: CampaignStatus;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignInput {
  name: string;
  subject: string;
  bodyHtml: string;
  recipientMode: RecipientMode;
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

export interface PreviewRecipientsInput {
  audienceId?: string;
  tagId?: string;
  pasted?: string[];
}

export interface RecipientResolutionResult {
  matched: ContactResponse[];
  unmatched: string[];
}

export interface PreviewRecipientsResponse {
  matched: ContactResponse[];
  unmatched: string[];
  totalMatched: number;
  totalUnmatched: number;
}

export interface ScheduleCampaignInput {
  scheduledAt: string;
}

export interface CampaignTransition {
  fromStatus: CampaignStatus;
  toStatus: CampaignStatus;
  scheduledAt?: Date | null;
}
