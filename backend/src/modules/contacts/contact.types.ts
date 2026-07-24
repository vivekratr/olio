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
