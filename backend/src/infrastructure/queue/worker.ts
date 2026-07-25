import { Worker } from "bullmq";

import type { CampaignProcessor } from "../../modules/campaigns/campaign.processor.js";
import { CAMPAIGN_SEND_JOB_NAME } from "./campaign.queue.js";
import { connection } from "./queue.js";

export function startCampaignWorker(processor: CampaignProcessor): Worker {
  return new Worker(
    "campaigns",
    async (job) => {
      if (job.name !== CAMPAIGN_SEND_JOB_NAME) {
        return;
      }

      await processor.process(job);
    },
    { connection },
  );
}
