import type { Contact, CreateContactInput } from "@/types/contact.types";

const TAGS_FIELD = "tags";

export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export function tagsToInput(tags: string[]): string {
  return tags.join(", ");
}

export function splitCustomFields(customFields: Record<string, unknown>): {
  tags: string[];
  dynamicFields: Array<{ key: string; value: string }>;
} {
  const tags = parseTags(customFields[TAGS_FIELD]);
  const dynamicFields = Object.entries(customFields)
    .filter(([key]) => key !== TAGS_FIELD)
    .map(([key, value]) => ({
      key,
      value: value === null || value === undefined ? "" : String(value),
    }));

  return { tags, dynamicFields };
}

export function mergeContactInput(
  name: string,
  email: string,
  phone: string,
  tagsInput: string,
  dynamicFields: Array<{ key: string; value: string }>,
): CreateContactInput {
  const customFields: Record<string, unknown> = {};

  const tags = parseTags(tagsInput);
  if (tags.length > 0) {
    customFields[TAGS_FIELD] = tags;
  }

  for (const field of dynamicFields) {
    const key = field.key.trim();
    if (!key) {
      continue;
    }

    customFields[key] = field.value;
  }

  const input: CreateContactInput = {
    name: name.trim() || undefined,
    email: email.trim() || undefined,
    phone: phone.trim() || undefined,
  };

  if (Object.keys(customFields).length > 0) {
    input.customFields = customFields;
  }

  return input;
}

export function contactToFormDefaults(contact?: Contact): {
  name: string;
  email: string;
  phone: string;
  tagsInput: string;
  dynamicFields: Array<{ key: string; value: string }>;
} {
  if (!contact) {
    return {
      name: "",
      email: "",
      phone: "",
      tagsInput: "",
      dynamicFields: [],
    };
  }

  const tags =
    (contact.tags ?? []).length > 0
      ? (contact.tags ?? [])
      : parseTags(contact.customFields[TAGS_FIELD]);

  const { dynamicFields } = splitCustomFields(contact.customFields);

  return {
    name: contact.name ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    tagsInput: tagsToInput(tags),
    dynamicFields,
  };
}

export function formatCustomFieldsPreview(
  customFields: Record<string, unknown>,
): string {
  const { dynamicFields } = splitCustomFields(customFields);

  if (dynamicFields.length === 0) {
    return "—";
  }

  return dynamicFields.map((field) => `${field.key}: ${field.value}`).join(", ");
}
