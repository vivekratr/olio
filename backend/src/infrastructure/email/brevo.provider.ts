import { env } from "../../common/config/env.js";
import type { EmailProvider } from "./email.provider.js";
import type { EmailSendInput, EmailSendResult } from "./email.types.js";

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

export class BrevoProvider implements EmailProvider {
  async send(input: EmailSendInput): Promise<EmailSendResult> {
    const response = await fetch(BREVO_SEND_URL, {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: env.BREVO_SENDER_NAME,
          email: env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
      }),
    });

    if (!response.ok) {
      throw new Error("Email send failed");
    }

    const body = (await response.json()) as { messageId?: string };
    if (!body.messageId) {
      throw new Error("Email send failed");
    }

    return { providerMessageId: body.messageId };
  }
}
