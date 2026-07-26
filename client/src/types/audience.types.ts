export type AudienceMatch = "all" | "any";

export type AudienceOperator = "eq" | "neq" | "contains" | "in";

export interface AudienceRule {
  field: string;
  operator: AudienceOperator | string;
  value: unknown;
}

export interface AudienceFilter {
  match?: AudienceMatch;
  rules: AudienceRule[];
}

export interface Audience {
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

export type PreviewAudienceInput =
  | { audienceId: string }
  | { filter: AudienceFilter };
