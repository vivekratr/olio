import { z } from "zod";

const contactFieldsSchema = z.object({
  name: z.string().optional(),
  email: z.email("Please enter a valid email address").optional(),
  phone: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export const createContactSchema = contactFieldsSchema.refine(
  (data) => Boolean(data.email) || Boolean(data.phone),
  {
    message: "Either email or phone is required",
    path: ["email"],
  },
);

export const updateContactSchema = contactFieldsSchema
  .partial()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined ||
      data.customFields !== undefined,
    {
      message: "At least one field is required",
    },
  );

const contactSortFields = ["createdAt", "name", "email"] as const;
const contactSortOrders = ["asc", "desc"] as const;

export const listContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.enum(contactSortFields).default("createdAt"),
  order: z.enum(contactSortOrders).default("desc"),
});

export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;

export const REQUIRED_CSV_HEADERS = [
  "name",
  "email",
  "phone",
  "city",
  "tags",
] as const;
