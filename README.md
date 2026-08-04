# Velkor

Full-stack intranet platform: document management & realtime chat. Clean architecture (React, Express, PostgreSQL, Redis).

pnpm workspace with two packages: `client` (Vite + React 19) and `server` (Express 5 + Prisma 7).

## Prerequisites

- pnpm ^11.10.0
- Docker (Postgres 16 + Redis 7)
- `server/.env` (copy `server/.env.example`) with `DATABASE_URL`, `SALT_ROUNDS`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`

## Setup

```sh
pnpm install
docker compose up -d
pnpm --filter velkor-server prisma migrate dev
pnpm --filter velkor-server prisma generate
pnpm --filter velkor-server seed
```

The Prisma client is generated to `server/src/generated/prisma` and gitignored; run `pnpm prisma generate` from `server/` after every schema change.

## Development

```sh
pnpm dev          # client (:5173) + server (:3000)
pnpm --filter client lint
pnpm --filter velkor-server dev   # server only
```

## Seeded accounts

- Admin: `admin@velkor.local` / `Admin123!`
- Travel agency: `sara.mansour@velkor.local` / `Agency123!`
