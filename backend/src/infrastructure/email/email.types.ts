export interface EmailSendInput {
  to: string;
  subject: string;
  html: string;
}

export interface EmailSendResult {
  providerMessageId: string;
}
