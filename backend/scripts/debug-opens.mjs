import pg from "pg";

const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://olio:zoro@localhost:5432/email_marketing?schema=public",
});

await client.connect();

const events = await client.query(`
  SELECT ce.event_type, ce.provider_event_id, cr.provider_message_id, cr.status
  FROM campaign_events ce
  JOIN campaign_recipients cr ON cr.id = ce.campaign_recipient_id
  ORDER BY ce.received_at DESC
  LIMIT 20
`);
console.log("EVENTS:", JSON.stringify(events.rows, null, 2));

const recips = await client.query(`
  SELECT cr.id, cr.status, cr.provider_message_id, c.name, c.id AS campaign_id
  FROM campaign_recipients cr
  JOIN campaigns c ON c.id = cr.campaign_id
  ORDER BY cr.id DESC
  LIMIT 10
`);
console.log("RECIPIENTS:", JSON.stringify(recips.rows, null, 2));

const metrics = await client.query(`
  SELECT c.id, c.name, c.status,
    (SELECT COUNT(*)::int FROM campaign_recipients cr WHERE cr.campaign_id = c.id) AS recipients,
    (SELECT COUNT(DISTINCT ce.campaign_recipient_id)::int
       FROM campaign_events ce
       JOIN campaign_recipients cr ON cr.id = ce.campaign_recipient_id
      WHERE cr.campaign_id = c.id AND ce.event_type = 'delivered') AS delivered,
    (SELECT COUNT(DISTINCT ce.campaign_recipient_id)::int
       FROM campaign_events ce
       JOIN campaign_recipients cr ON cr.id = ce.campaign_recipient_id
      WHERE cr.campaign_id = c.id AND ce.event_type = 'opened') AS opened
  FROM campaigns c
  ORDER BY c.updated_at DESC
  LIMIT 8
`);
console.log("CAMPAIGN METRICS:", JSON.stringify(metrics.rows, null, 2));

await client.end();
