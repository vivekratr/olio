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
