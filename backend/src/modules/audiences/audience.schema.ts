import { z } from "zod";

export const audienceFilterSchema = z.looseObject({});

export const createAudienceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  filter: audienceFilterSchema,
});

export const updateAudienceSchema = createAudienceSchema
  .partial()
  .refine((data) => data.name !== undefined || data.filter !== undefined, {
    message: "At least one field is required",
  });

export const previewAudienceSchema = z.union([
  z.object({ audienceId: z.string().min(1, "Audience id is required") }),
  z.object({ filter: audienceFilterSchema }),
]);

export type PreviewAudienceInput = z.infer<typeof previewAudienceSchema>;
