import { z } from "zod";

export const createTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),
});

export const updateTagSchema = createTagSchema.partial().refine(
  (data) => data.name !== undefined,
  { message: "At least one field is required" },
);

export const tagContactsSchema = z.object({
  contactIds: z
    .array(z.string().min(1, "Contact id is required"))
    .min(1, "At least one contact id is required"),
});

export type TagContactsInput = z.infer<typeof tagContactsSchema>;
