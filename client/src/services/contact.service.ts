import { apiDelete, apiGet, apiPost, apiPut, apiUpload } from "@/lib/api";
import type {
  Contact,
  ContactListResponse,
  CreateContactInput,
  ImportContactsOptions,
  ImportSummary,
  ListContactsParams,
  UpdateContactInput,
} from "@/types/contact.types";

function toQueryString(params: ListContactsParams): string {
  const search = new URLSearchParams();

  if (params.page !== undefined) {
    search.set("page", String(params.page));
  }
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  if (params.search) {
    search.set("search", params.search);
  }
  if (params.sort) {
    search.set("sort", params.sort);
  }
  if (params.order) {
    search.set("order", params.order);
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listContacts(
  params: ListContactsParams = {},
): Promise<ContactListResponse> {
  return apiGet<ContactListResponse>(`/contacts${toQueryString(params)}`);
}

export function createContact(input: CreateContactInput): Promise<Contact> {
  return apiPost<Contact>("/contacts", input);
}

export function updateContact(
  id: string,
  input: UpdateContactInput,
): Promise<Contact> {
  return apiPut<Contact>(`/contacts/${id}`, input);
}

export function deleteContact(id: string): Promise<Contact> {
  return apiDelete<Contact>(`/contacts/${id}`);
}

export function importContactsCsv({
  file,
  tagIds = [],
}: ImportContactsOptions): Promise<ImportSummary> {
  const fields =
    tagIds.length > 0 ? { tagIds: JSON.stringify(tagIds) } : undefined;

  return apiUpload<ImportSummary>("/contacts/import", file, fields);
}
