import { z } from "zod";

export const brevoWebhookSchema = z.looseObject({
  event: z.string(),
  id: z.coerce.number(),
  "message-id": z.string(),
  user_agent: z.string().optional(),
});

export type BrevoWebhookPayload = z.infer<typeof brevoWebhookSchema>;

const SUPPORTED_EVENTS: Record<string, string> = {
  sent: "sent",
  delivered: "delivered",
  opened: "opened",
  unique_opened: "opened",
  proxy_open: "opened",
  unique_proxy_open: "opened",
  hard_bounce: "bounced",
  soft_bounce: "bounced",
  blocked: "bounced",
  invalid_email: "bounced",
  error: "bounced",
};

export function mapBrevoEvent(event: string): string | null {
  return SUPPORTED_EVENTS[event] ?? null;
}
