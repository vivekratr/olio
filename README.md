# Olio

## 1. One-line description

A lightweight email marketing tool: manage **contacts** and **audiences**, build **campaigns**, **send now or schedule** for later (scheduled campaigns can be **rescheduled**), and view **open/delivery analytics** from provider webhooks.

## 2. Stack

- **Next.js** — frontend (`client/`)
- **Express + TypeScript** — API (`backend/`)
- **PostgreSQL + Prisma 7** — data layer
- **Redis + BullMQ** — scheduled sends (survives server restarts)
- **Brevo** — transactional email sending + webhooks for delivery/open events

## 3. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22.x |
| pnpm | 11.x |
| PostgreSQL | 16+ |
| Redis | 7+ |
| Brevo | free-tier API key + verified sender + [IP whitelist](https://app.brevo.com/security/authorised_ips) + [webhook](https://app.brevo.com/app-store/webhooks) |

### macOS (Homebrew)

```bash
brew install node@22 pnpm postgresql@16 redis
brew services start postgresql@16
brew services start redis
createdb email_marketing
```

### Docker Compose (Postgres + Redis only)

From `backend/` — no local Postgres/Redis install needed:

```bash
cp .env.example .env
# Set POSTGRES_PASSWORD (and Brevo vars — see §4)

docker compose up -d postgres redis
```

Defaults: Postgres `localhost:5432`, Redis `localhost:6379`. Use `DATABASE_URL=postgresql://olio:<POSTGRES_PASSWORD>@localhost:5432/email_marketing?schema=public` in `.env`.

## 4. Quick start

```bash
# Backend
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PG_PASSWORD@localhost:5432/email_marketing?schema=public"
JWT_SECRET=any-long-random-string
REDIS_URL=redis://localhost:6379
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=verified-sender@yourdomain.com
BREVO_SENDER_NAME=Olio
BREVO_WEBHOOK_TOKEN=your-webhook-token   # same value in Brevo webhook auth (see §5b)
```

```bash
pnpm install
pnpm approve-builds   # allow bcrypt if prompted → pnpm rebuild bcrypt
pnpm prisma:migrate:deploy
pnpm dev              # http://localhost:5000
```

```bash
# Frontend (new terminal)
cd client
echo 'NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1' > .env.local
pnpm install
pnpm dev              # http://localhost:3000
```

**Verify:** `curl http://localhost:5000/api/v1/health`

Open **http://localhost:3000** → sign up → add a contact → create & send a campaign.

## 5. Brevo setup (required)

Both steps below are required for a working demo — skip either and sends or campaign stats will fail.

### 5a. Whitelist your IP (required to send email)

Brevo blocks all IPs by default. Add your machine's public IP before sending:

1. Open [Brevo → Security → Authorised IPs](https://app.brevo.com/security/authorised_ips)
2. Add your current public IP (search "what is my ip" if unsure)

Without this, Brevo will reject API send requests and recipients won't receive emails.

### 5b. Webhook URL (required for campaign stats)

Campaign sent/delivered/opened counts only update when Brevo can POST events to your backend. Without this, stats stay at zero after send.

1. Expose your API publicly (local dev: `ngrok http 5000`)
2. Open [Brevo → Webhooks](https://app.brevo.com/app-store/webhooks) → create an **outbound** webhook (Transactional events)
3. **URL:** `https://<your_backend_url>/api/v1/webhooks/brevo`  
   Examples: `https://abc123.ngrok-free.app/api/v1/webhooks/brevo` (local) or `https://your-vps.example.com/api/v1/webhooks/brevo` (deployed)
4. Enable events: **delivered**, **opened**, **unique opened**, **proxy open**, **unique proxy open**, **hard bounce**, **soft bounce** (Gmail/Apple often send proxy-open events instead of plain opened)
5. Generate a token (e.g. `openssl rand -hex 32`), set `BREVO_WEBHOOK_TOKEN` in `backend/.env`, and paste the **same** value in Brevo's webhook Token authentication field

## 6. Full Docker Compose (API + DB + Redis)

```bash
cd backend
cp .env.example .env   # POSTGRES_PASSWORD, JWT_SECRET, BREVO_* all required
docker compose up --build -d
```

Run the client locally with `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`.

## 7. Not shown in demo video

- **Reschedule scheduled campaigns** — open a campaign with status **Scheduled**, change the send date/time, and save. The backend updates the BullMQ job (`CampaignScheduler` + `rescheduleJob`) so the new time is used even after a server restart.

## 8. Tradeoffs

- Tenant isolation enforced in the API (`accountId` from JWT), not just the UI
- Scheduled sends via BullMQ — not `setTimeout`
- Paste-recipient mode matches saved contacts only; unmatched emails are skipped
- Open tracking is approximate; Brevo IP whitelist + webhook URL are required for sends and live stats
