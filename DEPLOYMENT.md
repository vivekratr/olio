# Olio Production Deployment Checklist

## Pre-deploy verification (local / CI)

| Check | Command / URL | Status |
|-------|---------------|--------|
| Backend env schema | All vars in `backend/.env.example` set in prod | Required |
| Backend build | `cd backend && pnpm build` | Pass |
| Frontend build | `cd client && pnpm build` | Pass (after `pageExtensions` fix) |
| Prisma schema | `cd backend && pnpm exec prisma validate` | Pass |
| Prisma migrations | `cd backend && pnpm prisma:migrate:deploy` | Run against prod DB before start |
| Redis | `redis-cli -u $REDIS_URL ping` → `PONG` | Required for scheduled sends |
| API health | `GET /api/v1/health` | Pass when DB + server up |
| Brevo webhook | `POST /api/v1/webhooks/brevo` (public, no auth) | Register URL in Brevo dashboard |

## Backend environment variables

Set in your host (Railway, Render, Fly, etc.). Validated at boot via Zod in `backend/src/common/config/env.ts`.

| Variable | Production notes |
|----------|------------------|
| `NODE_ENV` | `production` |
| `PORT` | Host-assigned port (default `5000`) |
| `DATABASE_URL` | Managed PostgreSQL URL; requires `citext` + `pgcrypto` extensions |
| `JWT_SECRET` | Long random secret (not dev value) |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `REDIS_URL` | Managed Redis URL (TLS if provider requires `rediss://`) |
| `BREVO_API_KEY` | Transactional API key from Brevo |
| `BREVO_SENDER_EMAIL` | Verified sender domain in Brevo |
| `BREVO_SENDER_NAME` | Display name for outbound mail |

## Frontend environment variables

| Variable | Production notes |
|----------|------------------|
| `NEXT_PUBLIC_API_URL` | Full API base including `/api/v1`, e.g. `https://api.example.com/api/v1` |

Set at **build time** on Vercel/Netlify/etc. Without it, the client falls back to `http://localhost:5000/api/v1`.

## Deploy commands

### Backend

```bash
cd backend
pnpm install --frozen-lockfile
pnpm build
pnpm prisma:migrate:deploy   # apply pending migrations
pnpm start                   # node dist/index.js
```

BullMQ worker starts in the same process as the API (`startCampaignWorker` in `src/index.ts`). No separate worker service required unless you scale out later.

### Frontend

```bash
cd client
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

## External service configuration

### Brevo

1. Create / use a transactional API key → `BREVO_API_KEY`
2. Verify sender domain → `BREVO_SENDER_EMAIL`
3. **Webhooks** → add outbound URL: `https://<api-host>/api/v1/webhooks/brevo`
   - Events used: `sent`, `delivered`, `opened`, `hard_bounce`, `soft_bounce`
   - Endpoint is public (no signature check today)
4. Make sure to add your IP address to the whitelist, because Brevo by default blocks all request unless re

### Redis

Required for campaign scheduling (BullMQ). Local dev: Docker `olio-redis` on `redis://localhost:6379`.

### PostgreSQL

11 migrations in `backend/prisma/migrations/`. First migration enables `citext` and `pgcrypto`.

## Verified locally (2026-07-26)

- Backend `pnpm build` — pass
- Client `pnpm build` — pass (11 app routes; fixed `src/pages` → `src/views` conflict with Pages Router)
- Prisma `validate` — pass
- Prisma `migrate status` — blocked (PostgreSQL not running on `localhost:5432`)
- Redis `PING` — pass (`olio-redis`)
- Backend start + BullMQ worker — pass (worker in-process, no startup log)
- `GET /api/v1/health` — pass
- `POST /api/v1/webhooks/brevo` — route exists; returns 500 when DB unreachable (expected without Postgres)

## Missing / recommended production configuration

| Item | Priority | Notes |
|------|----------|-------|
| `NEXT_PUBLIC_API_URL` in prod client env | **Required** | Currently empty in `client/.env` |
| Managed PostgreSQL | **Required** | Not running locally during audit |
| `NODE_ENV=production` on API host | **Required** | Local `.env` still `development` |
| Strong `JWT_SECRET` in prod | **Required** | Rotate from dev secret |
| Brevo webhook URL in Brevo console | **Required** | Must be publicly reachable HTTPS |
| Brevo sender domain verification | **Required** | Or sends will fail |
| CORS origin restriction | Low | API uses open `cors()`; fine for MVP, tighten with `CORS_ORIGIN` if needed |
| Webhook signature verification | Low | Brevo supports signing; not implemented |
| `trust proxy` for reverse proxy | Low | Add if behind load balancer and you need correct client IPs |
| Separate BullMQ worker process | Low | Single process is fine until queue throughput matters |
| Docker / IaC manifests | Low | Not in repo; deploy via platform UI or add later |
| Health check wired to orchestrator | Medium | Point probe at `/api/v1/health` |
