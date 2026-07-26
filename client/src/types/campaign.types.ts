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
