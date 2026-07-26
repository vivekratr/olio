export interface EmailAttachment {
  name: string;
  content: string;
}

export interface EmailSendInput {
  to: string;
  subject: string;
  html: string;
  attachment?: EmailAttachment;
}

export interface EmailSendResult {
  providerMessageId: string;
}
