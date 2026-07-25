export type AudienceMatch = "all" | "any";

export type AudienceField =
  | "tag"
  | "name"
  | "email"
  | "phone"
  | "customFields.city";

export type AudienceOperator = "eq" | "neq" | "contains" | "in";

export interface AudienceRule {
  field: AudienceField | string;
  operator: AudienceOperator | string;
  value: unknown;
}

export interface AudienceFilter {
  match?: AudienceMatch;
  rules: AudienceRule[];
}

export interface AudienceResponse {
  id: string;
  name: string;
  filter: AudienceFilter;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAudienceInput {
  name: string;
  filter: AudienceFilter;
}

export type UpdateAudienceInput = Partial<CreateAudienceInput>;
