import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Contact } from "@/types/contact.types";
import type {
  Audience,
  CreateAudienceInput,
  PreviewAudienceInput,
  UpdateAudienceInput,
} from "@/types/audience.types";

export function listAudiences(): Promise<Audience[]> {
  return apiGet<Audience[]>("/audiences");
}

export function getAudience(id: string): Promise<Audience> {
  return apiGet<Audience>(`/audiences/${id}`);
}

export function createAudience(input: CreateAudienceInput): Promise<Audience> {
  return apiPost<Audience>("/audiences", input);
}

export function updateAudience(
  id: string,
  input: UpdateAudienceInput,
): Promise<Audience> {
  return apiPatch<Audience>(`/audiences/${id}`, input);
}

export function deleteAudience(id: string): Promise<Audience> {
  return apiDelete<Audience>(`/audiences/${id}`);
}

export function previewAudience(input: PreviewAudienceInput): Promise<Contact[]> {
  return apiPost<Contact[]>("/audiences/preview", input);
}
