import { z } from "zod";

const recipientModeSchema = z.enum(["audience", "tag", "paste"]);

const campaignFieldsSchema = z.object({
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
  audienceId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  pastedRecipients: z.array(z.string().trim().min(1)).optional(),
});

export const createCampaignSchema = campaignFieldsSchema;

export const updateCampaignSchema = campaignFieldsSchema
  .partial()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.subject !== undefined ||
      data.bodyHtml !== undefined ||
      data.recipientMode !== undefined ||
      data.audienceId !== undefined ||
      data.tagId !== undefined ||
      data.pastedRecipients !== undefined,
    { message: "At least one field is required" },
  );

export const scheduleCampaignSchema = z.object({
  scheduledAt: z.string().min(1, "Scheduled time is required"),
});

export const previewRecipientsSchema = z.object({
  recipientMode: recipientModeSchema,
  audienceId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  pasted: z.array(z.string()).optional(),
});
