import { BaseRepository } from "../../common/database/base.repository.js";
import type {
  CampaignMetrics,
  CampaignTimelineEntry,
} from "./analytics.types.js";

interface MetricsRow {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
}

interface TimelineRow {
  bucket: Date;
  event_type: string;
  count: number;
}

export class AnalyticsRepository extends BaseRepository {
  async getCampaignMetrics(
    accountId: string,
    campaignId: string,
  ): Promise<CampaignMetrics> {
    const [row] = await this.prisma.$queryRaw<MetricsRow[]>`
      WITH scoped_recipients AS (
        SELECT cr.id, cr.status
        FROM campaign_recipients cr
        INNER JOIN campaigns c ON c.id = cr.campaign_id
        WHERE cr.campaign_id = ${campaignId}::uuid
          AND c.account_id = ${accountId}::uuid
      ),
      event_counts AS (
        SELECT
          ce.event_type,
          COUNT(DISTINCT ce.campaign_recipient_id)::int AS cnt
        FROM campaign_events ce
        INNER JOIN scoped_recipients sr ON sr.id = ce.campaign_recipient_id
        GROUP BY ce.event_type
      )
      SELECT
        (SELECT COUNT(*)::int FROM scoped_recipients) AS total,
        (SELECT COUNT(*)::int FROM scoped_recipients WHERE status = 'pending') AS pending,
        (SELECT COUNT(*)::int FROM scoped_recipients WHERE status != 'pending') AS sent,
        COALESCE(
          (SELECT cnt FROM event_counts WHERE event_type = 'delivered'),
          0
        ) AS delivered,
        COALESCE(
          (SELECT cnt FROM event_counts WHERE event_type = 'opened'),
          0
        ) AS opened,
        COALESCE(
          (SELECT cnt FROM event_counts WHERE event_type = 'bounced'),
          0
        ) AS bounced,
        (SELECT COUNT(*)::int FROM scoped_recipients WHERE status = 'failed') AS failed
    `;

    return {
      total: Number(row?.total ?? 0),
      pending: Number(row?.pending ?? 0),
      sent: Number(row?.sent ?? 0),
      delivered: Number(row?.delivered ?? 0),
      opened: Number(row?.opened ?? 0),
      bounced: Number(row?.bounced ?? 0),
      failed: Number(row?.failed ?? 0),
    };
  }

  async getCampaignTimeline(
    accountId: string,
    campaignId: string,
  ): Promise<CampaignTimelineEntry[]> {
    const rows = await this.prisma.$queryRaw<TimelineRow[]>`
      SELECT
        date_trunc('hour', ce.received_at) AS bucket,
        ce.event_type,
        COUNT(DISTINCT ce.campaign_recipient_id)::int AS count
      FROM campaign_events ce
      INNER JOIN campaign_recipients cr ON cr.id = ce.campaign_recipient_id
      INNER JOIN campaigns c ON c.id = cr.campaign_id
      WHERE cr.campaign_id = ${campaignId}::uuid
        AND c.account_id = ${accountId}::uuid
      GROUP BY bucket, ce.event_type
      ORDER BY bucket ASC
    `;

    return rows.map((row) => ({
      bucket: row.bucket.toISOString(),
      eventType: row.event_type,
      count: Number(row.count),
    }));
  }
}
