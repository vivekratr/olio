export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListResponse {
  items: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateContactInput {
  name?: string;
  email?: string;
  phone?: string;
  customFields?: Record<string, unknown>;
}

export type UpdateContactInput = Partial<CreateContactInput>;

export interface ImportRejectedRow {
  rowNumber: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  tags: string[];
  reason: string;
}

export interface ImportSummary {
  imported: number;
  duplicates: ImportRejectedRow[];
  invalid: ImportRejectedRow[];
}

export interface ListContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "createdAt" | "name" | "email";
  order?: "asc" | "desc";
}
