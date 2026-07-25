import { QueueEvents } from "bullmq";
import { Redis } from "ioredis";

import { env } from "../../common/config/env.js";

export { QueueEvents };

export const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const queueEvents = new QueueEvents("campaigns", { connection });
