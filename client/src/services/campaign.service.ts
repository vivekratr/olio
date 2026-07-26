import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api";
import type {
  Campaign,
  CreateCampaignInput,
  PreviewRecipientsRequest,
  PreviewRecipientsResponse,
  ScheduleCampaignInput,
  UpdateCampaignInput,
} from "@/types/campaign.types";

export function listCampaigns(): Promise<Campaign[]> {
  return apiGet<Campaign[]>("/campaigns");
}

export function getCampaign(id: string): Promise<Campaign> {
  return apiGet<Campaign>(`/campaigns/${id}`);
}

export function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  return apiPost<Campaign>("/campaigns", input);
}

export function updateCampaign(
  id: string,
  input: UpdateCampaignInput,
): Promise<Campaign> {
  return apiPatch<Campaign>(`/campaigns/${id}`, input);
}

export function deleteCampaign(id: string): Promise<Campaign> {
  return apiDelete<Campaign>(`/campaigns/${id}`);
}

export function sendCampaign(id: string): Promise<Campaign> {
  return apiPost<Campaign>(`/campaigns/${id}/send`, {});
}

export function scheduleCampaign(
  id: string,
  input: ScheduleCampaignInput,
): Promise<Campaign> {
  return apiPost<Campaign>(`/campaigns/${id}/schedule`, input);
}

export function previewCampaignRecipients(
  input: PreviewRecipientsRequest,
): Promise<PreviewRecipientsResponse> {
  return apiPost<PreviewRecipientsResponse>("/campaigns/recipients/preview", input);
}

export function uploadCampaignAttachment(
  id: string,
  file: File,
): Promise<Campaign> {
  return apiUpload<Campaign>(`/campaigns/${id}/attachment`, file);
}

export function removeCampaignAttachment(id: string): Promise<Campaign> {
  return apiDelete<Campaign>(`/campaigns/${id}/attachment`);
}
