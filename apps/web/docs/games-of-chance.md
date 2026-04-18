# Games of chance (implementation notes)

## Overview

Unified Prisma models under `game_*` tables (see `packages/prisma/prisma/models/game_campaign.prisma`) power **spin wheel**, **lottery**, and **scratch** style campaigns.

- **Settings UI**: `/settings/games`
- **Analytics UI**: `/settings/games/analytics`
- **Admin APIs**: `/api/games/*`
- **Analytics APIs**: `/api/analytics/games/*`

## Lottery scheduler

Scheduled draws use `game_draw_batch` + `game_draw_entry.drawBatchId`. Trigger completion via:

- `POST /api/games/lottery/draws/run` with `{ "drawBatchId": "<uuid>" }`

Wire a cron (e.g. Vercel Cron) to call this when `scheduledAt <= now()` for batches in `SCHEDULED` status.

## Legacy scratch cards

Existing `ScratchCard` models remain. New campaigns may set `legacyScratchCardId` when migrating. See `apps/web/src/lib/gamification/scratch-bridge.ts`.

## Tests

`apps/web/src/lib/gamification/__tests__/allocation-engine.node.test.ts` — run with:

`node --import tsx --test apps/web/src/lib/gamification/__tests__/allocation-engine.node.test.ts`

(Requires `tsx` and generated Prisma client only for DB-backed tests; this file tests pure allocation logic.)
