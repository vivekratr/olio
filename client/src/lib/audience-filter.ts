import type {
  AudienceFilter,
  AudienceMatch,
  AudienceOperator,
  AudienceRule,
} from "@/types/audience.types";

export type RuleFieldType = "tag" | "city" | "department" | "custom";

export interface BuilderRule {
  id: string;
  fieldType: RuleFieldType;
  customKey: string;
  operator: AudienceOperator;
  value: string;
}

export function createEmptyRule(): BuilderRule {
  return {
    id: crypto.randomUUID(),
    fieldType: "tag",
    customKey: "",
    operator: "eq",
    value: "",
  };
}

export function ruleToApiField(rule: BuilderRule): string {
  switch (rule.fieldType) {
    case "tag":
      return "tag";
    case "city":
      return "customFields.city";
    case "department":
      return "customFields.department";
    case "custom":
      return `customFields.${rule.customKey.trim()}`;
    default: {
      const exhaustive: never = rule.fieldType;
      return exhaustive;
    }
  }
}

export function serializeFilter(
  match: AudienceMatch,
  rules: BuilderRule[],
): AudienceFilter {
  return {
    match,
    rules: rules
      .filter((rule) => rule.value.trim())
      .map((rule) => ({
        field: ruleToApiField(rule),
        operator: rule.operator,
        value: rule.value.trim(),
      })),
  };
}

export function deserializeFilter(filter: AudienceFilter): {
  match: AudienceMatch;
  rules: BuilderRule[];
} {
  const match = filter.match ?? "all";

  if (!filter.rules?.length) {
    return { match, rules: [createEmptyRule()] };
  }

  const rules = filter.rules.map((rule) => builderRuleFromApi(rule));
  return { match, rules };
}

function builderRuleFromApi(rule: AudienceRule): BuilderRule {
  if (rule.field === "tag") {
    return {
      id: crypto.randomUUID(),
      fieldType: "tag",
      customKey: "",
      operator: (rule.operator as AudienceOperator) ?? "eq",
      value: String(rule.value ?? ""),
    };
  }

  if (rule.field === "customFields.city") {
    return {
      id: crypto.randomUUID(),
      fieldType: "city",
      customKey: "",
      operator: (rule.operator as AudienceOperator) ?? "eq",
      value: String(rule.value ?? ""),
    };
  }

  if (rule.field === "customFields.department") {
    return {
      id: crypto.randomUUID(),
      fieldType: "department",
      customKey: "",
      operator: (rule.operator as AudienceOperator) ?? "eq",
      value: String(rule.value ?? ""),
    };
  }

  const customPrefix = "customFields.";
  const customKey = rule.field.startsWith(customPrefix)
    ? rule.field.slice(customPrefix.length)
    : rule.field;

  return {
    id: crypto.randomUUID(),
    fieldType: "custom",
    customKey,
    operator: (rule.operator as AudienceOperator) ?? "eq",
    value: String(rule.value ?? ""),
  };
}

export function summarizeFilter(filter: AudienceFilter): string {
  const match = filter.match === "any" ? "ANY" : "ALL";
  const parts = filter.rules?.map(
    (rule) => `${rule.field} ${rule.operator} ${String(rule.value)}`,
  );

  if (!parts?.length) {
    return "No rules";
  }

  return `${match}: ${parts.join("; ")}`;
}
