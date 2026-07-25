-- AlterTable
ALTER TABLE "campaign_recipients" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "provider_message_id" TEXT;
