import type { EmailSendInput, EmailSendResult } from "./email.types.js";

export interface EmailProvider {
  send(input: EmailSendInput): Promise<EmailSendResult>;
}
