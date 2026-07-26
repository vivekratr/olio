import { z } from "zod";

export const createTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),
});

export const tagContactsSchema = z.object({
  contactIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one contact"),
});

export type TagFormValues = z.infer<typeof createTagSchema>;
