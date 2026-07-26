import { z } from "zod";

const recipientModeSchema = z.enum(["audience", "tag", "paste"]);

const baseCampaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Campaign name is required")
    .max(100, "Name must be at most 100 characters"),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject must be at most 200 characters"),
  fromName: z
    .string()
    .trim()
    .max(100, "From name must be at most 100 characters"),
  replyTo: z.union([
    z.literal(""),
    z.email("Please enter a valid reply-to email"),
  ]),
  bodyHtml: z.string().min(1, "Email body is required"),
  recipientMode: recipientModeSchema,
  audienceId: z.string(),
  tagId: z.string(),
  pastedRecipients: z.string(),
});

function recipientRefine(
  data: z.infer<typeof baseCampaignSchema>,
  ctx: z.RefinementCtx,
) {
  if (data.recipientMode === "audience" && !data.audienceId) {
    ctx.addIssue({
      code: "custom",
      message: "Select an audience",
      path: ["audienceId"],
    });
  }
  if (data.recipientMode === "tag" && !data.tagId) {
    ctx.addIssue({
      code: "custom",
      message: "Select a tag",
      path: ["tagId"],
    });
  }
  if (data.recipientMode === "paste" && !data.pastedRecipients.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Paste at least one email or phone",
      path: ["pastedRecipients"],
    });
  }
}

export const campaignFormSchema = baseCampaignSchema.superRefine(recipientRefine);

export const campaignDraftSchema = baseCampaignSchema
  .extend({
    audienceId: z.string().optional(),
    tagId: z.string().optional(),
    pastedRecipients: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.recipientMode === "audience" && data.audienceId === "") {
      return;
    }
    if (data.recipientMode === "tag" && data.tagId === "") {
      return;
    }
    if (data.recipientMode === "paste" && !data.pastedRecipients?.trim()) {
      return;
    }
    recipientRefine(
      {
        ...data,
        audienceId: data.audienceId ?? "",
        tagId: data.tagId ?? "",
        pastedRecipients: data.pastedRecipients ?? "",
      },
      ctx,
    );
  });

export type CampaignFormSchemaValues = z.infer<typeof campaignFormSchema>;
