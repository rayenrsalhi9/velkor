# AGENTS.md

Full-stack intranet platform (document management + realtime chat). pnpm workspace with two packages: `client` (React) and `server` (Express). CI: GitHub Actions runs lint/build (client) and generate + typecheck + tests (server) on every push/PR (`.github/workflows/ci.yml`). Node version is pinned in `.nvmrc`.

## Commands

```sh
pnpm dev                          # run client + server together (concurrently)
pnpm --filter client dev          # vite dev server on :5173
pnpm --filter velkor-server dev   # tsx watch src/index.ts on :3000
pnpm --filter client lint         # oxlint — NOT eslint (see client/.oxlintrc.json)
pnpm --filter client build        # tsc -b && vite build
pnpm --filter velkor-server seed  # seed DB via tsx prisma/seed.ts
pnpm --filter velkor-server test  # node:test via tsx — no Jest/Vitest
```

Tests are colocated `*.test.ts` next to the code they cover (use-cases + middleware, mocked ports — no DB needed) and run with the **Node built-in test runner** via `tsx --test`. No new test deps. Server has no lint script; verify server changes with `pnpm typecheck` (from `server/`).

## Setup gotchas

- `docker compose up -d` for Postgres 16 + Redis 7 (Redis is declared but not yet used by code).
- `server/.env` is required and gitignored; copy from `server/.env.example` (tracked). Vars: `DATABASE_URL`, `SALT_ROUNDS`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
- Prisma client is generated to `server/src/generated/prisma` and **gitignored** — fresh clones must run `pnpm prisma generate` (from `server/`) before anything compiles, and regenerate after schema edits. Prisma 7 with `prisma-client` generator and `prisma.config.ts` (schema, migrations, seed, datasource url all live there, not in `schema.prisma` alone).
- Run Prisma commands from `server/` (`pnpm prisma migrate dev`, `pnpm prisma generate`).
- Seeded accounts: `admin@velkor.local` / `Admin123!`, `sara.mansour@velkor.local` / `Agency123!`.

## Server architecture

Clean architecture with manual dependency injection wired in `server/src/index.ts`:
`presentation/http` (handlers + middleware) → `application/use-cases` + `application/ports` (interfaces) → `domain/entities` → `infrastructure/*` (Prisma repos, bcrypt, JWT, SHA-256 hashers). New features: define a port, implement it in `infrastructure`, add a use case, and wire it up in `index.ts`.

- ESM (`type: module`, NodeNext): relative imports must end in `.js` even though files are `.ts`.
- Auth: access token is a short-lived JWT; refresh token in httpOnly cookie with rotation + reuse detection. `authenticate` middleware parses the Bearer token, `attachClaims` loads the user.

## Client conventions

- Vite + React 19 + Tailwind v4 (CSS-first config in `src/index.css`, no `tailwind.config`).
- Path alias `@/*` → `client/src/*`.
- UI kit is shadcn v4 backed by `@base-ui/react` (not Radix). Icons: lucide-react / @hugeicons/react. Font: Inter via @fontsource-variable.
- Vite dev server proxies `/auth` → `:3000`, so client calls use relative paths (`client/src/lib/api.ts`).
- Access token lives in module memory in `lib/api.ts`, never localStorage; `authFetch` transparently refreshes on 401.
- `react/react-only-export-components` is enforced (warn) by oxlint — keep components and hooks in separate files.
