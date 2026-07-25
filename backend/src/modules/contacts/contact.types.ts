export interface ContactResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  name?: string;
  email?: string;
  phone?: string;
  customFields?: Record<string, unknown>;
}

export type UpdateContactInput = Partial<CreateContactInput>;

export interface ContactListResponse {
  items: ContactResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ListContactsOptions {
  page: number;
  limit: number;
  search?: string;
  phoneSearch?: string;
  sort: "createdAt" | "name" | "email";
  order: "asc" | "desc";
}

export interface ImportRow {
  rowNumber: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  tags: string[];
}

export interface ImportRejectedRow extends ImportRow {
  reason: string;
}

export interface ImportPlan {
  readyToImport: ImportRow[];
  duplicateInDatabase: ImportRejectedRow[];
  duplicateInCsv: ImportRejectedRow[];
  invalidRows: ImportRejectedRow[];
}
export interface ImportSummary {
  imported: number;
  duplicates: ImportRejectedRow[];
  invalid: ImportRejectedRow[];
}
