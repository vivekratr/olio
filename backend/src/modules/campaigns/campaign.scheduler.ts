import { AppError } from "../../common/errors/app-error.js";
import type { Campaign } from "../../generated/prisma/client.js";
import type { CampaignStatus, CampaignTransition } from "./campaign.types.js";

const INVALID_SCHEDULE_TIME_MESSAGE = "Invalid schedule time";
const PAST_SCHEDULE_TIME_MESSAGE = "Schedule time must be in the future";
const INVALID_TRANSITION_MESSAGE = "Invalid campaign status transition";
const DRAFT_ONLY_MESSAGE = "Only draft campaigns can be sent now";

const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["scheduled", "sending"],
  scheduled: ["sending"],
  sending: ["sent", "failed"],
  sent: [],
  failed: [],
};

export class CampaignScheduler {
  validateScheduleTime(scheduledAt: Date): Date {
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new AppError(INVALID_SCHEDULE_TIME_MESSAGE, 400);
    }

    if (scheduledAt.getTime() <= Date.now()) {
      throw new AppError(PAST_SCHEDULE_TIME_MESSAGE, 400);
    }

    return scheduledAt;
  }

  schedule(campaign: Campaign, scheduledAt: Date): CampaignTransition {
    const fromStatus = campaign.status as CampaignStatus;
    if (fromStatus !== "draft") {
      throw new AppError(INVALID_TRANSITION_MESSAGE, 400);
    }

    this.assertTransition(fromStatus, "scheduled");

    const validAt = this.validateScheduleTime(scheduledAt);

    return {
      fromStatus,
      toStatus: "scheduled",
      scheduledAt: validAt,
    };
  }

  sendNow(campaign: Campaign): CampaignTransition {
    const fromStatus = campaign.status as CampaignStatus;
    if (fromStatus !== "draft") {
      throw new AppError(DRAFT_ONLY_MESSAGE, 400);
    }

    this.assertTransition(fromStatus, "sending");

    return {
      fromStatus,
      toStatus: "sending",
      scheduledAt: null,
    };
  }

  private assertTransition(from: CampaignStatus, to: CampaignStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new AppError(INVALID_TRANSITION_MESSAGE, 400);
    }
  }
}
