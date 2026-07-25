import { Queue } from "bullmq";

import { connection } from "./queue.js";

export const CAMPAIGN_SEND_JOB_NAME = "campaign-send";

export interface CampaignSendJobData {
  accountId: string;
  campaignId: string;
}

export class CampaignQueue {
  private readonly queue = new Queue<CampaignSendJobData>("campaigns", {
    connection,
  });

  async enqueueCampaign(
    data: CampaignSendJobData,
    scheduledAt?: Date | null,
  ): Promise<string> {
    const delay =
      scheduledAt === null || scheduledAt === undefined
        ? 0
        : Math.max(0, scheduledAt.getTime() - Date.now());

    const job = await this.queue.add(CAMPAIGN_SEND_JOB_NAME, data, { delay });

    if (!job.id) {
      throw new Error("BullMQ job id missing after enqueue");
    }

    return job.id;
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  async getJob(jobId: string) {
    return this.queue.getJob(jobId);
  }

  async rescheduleJob(
    jobId: string,
    data: CampaignSendJobData,
    scheduledAt: Date,
  ): Promise<string> {
    await this.cancelJob(jobId);
    return this.enqueueCampaign(data, scheduledAt);
  }
}
