export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed";

export type RecipientMode = "audience" | "tag" | "paste";

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  recipientMode: RecipientMode;
  audienceId: string | null;
  tagId: string | null;
  pastedRecipients: string[] | null;
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
  audienceId?: string;
  tagId?: string;
  pastedRecipients?: string[];
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

export interface ScheduleCampaignInput {
  scheduledAt: string;
}

export interface PreviewRecipientsRequest {
  recipientMode: RecipientMode;
  audienceId?: string;
  tagId?: string;
  pasted?: string[];
}

export interface PreviewRecipientsResponse {
  matched: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  }>;
  unmatched: string[];
  totalMatched: number;
  totalUnmatched: number;
}

export interface CampaignFormValues {
  name: string;
  subject: string;
  fromName: string;
  replyTo: string;
  bodyHtml: string;
  recipientMode: RecipientMode;
  audienceId?: string;
  tagId?: string;
  pastedRecipients?: string;
}
