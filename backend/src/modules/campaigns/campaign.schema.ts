import { z } from "zod";

const recipientModeSchema = z.enum(["audience", "tag", "paste"]);

export const createCampaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject must be at most 200 characters"),
  bodyHtml: z.string().min(1, "Body is required"),
  recipientMode: recipientModeSchema,
});

export const updateCampaignSchema = createCampaignSchema
  .partial()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.subject !== undefined ||
      data.bodyHtml !== undefined ||
      data.recipientMode !== undefined,
    { message: "At least one field is required" },
  );

export const scheduleCampaignSchema = z.object({
  scheduledAt: z.string().min(1, "Scheduled time is required"),
});
