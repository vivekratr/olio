import { z } from "zod";

const contactFieldsSchema = z.object({
  name: z.string().optional(),
  email: z.union([
    z.literal(""),
    z.email("Please enter a valid email address"),
  ]).optional(),
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

export type ContactFormValues = z.infer<typeof contactFieldsSchema>;
