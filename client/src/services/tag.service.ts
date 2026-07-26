import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Contact } from "@/types/contact.types";
import type {
  CreateTagInput,
  Tag,
  TagContactsInput,
  UpdateTagInput,
} from "@/types/tag.types";

export function listTags(): Promise<Tag[]> {
  return apiGet<Tag[]>("/tags");
}

export function createTag(input: CreateTagInput): Promise<Tag> {
  return apiPost<Tag>("/tags", input);
}

export function updateTag(id: string, input: UpdateTagInput): Promise<Tag> {
  return apiPatch<Tag>(`/tags/${id}`, input);
}

export function deleteTag(id: string): Promise<Tag> {
  return apiDelete<Tag>(`/tags/${id}`);
}

export function addContactsToTag(
  tagId: string,
  input: TagContactsInput,
): Promise<Contact[]> {
  return apiPost<Contact[]>(`/tags/${tagId}/contacts`, input);
}

export function removeContactFromTag(
  tagId: string,
  contactId: string,
): Promise<null> {
  return apiDelete<null>(`/tags/${tagId}/contacts/${contactId}`);
}

export function previewContactsByTag(tagName: string): Promise<Contact[]> {
  return apiPost<Contact[]>("/audiences/preview", {
    filter: {
      match: "all",
      rules: [{ field: "tag", operator: "eq", value: tagName }],
    },
  });
}
