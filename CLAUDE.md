# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

- `npm run dev` — Dev server (Next.js Turbo)
- `npm run build` — Production build
- `npm run typecheck` — Type check (`tsc --noEmit`)
- `npm run db:push` — Sync Prisma schema to DB
- `npm run db:generate` — Create migration (`prisma migrate dev`)

## Stack

T3 Stack: Next.js 15 (App Router, React 19) + tRPC 11 + Prisma 6 (PostgreSQL) + NextAuth 5 beta. See [docs/architecture.md](docs/architecture.md) for details.

## Key Conventions

- Path alias: `~/` → `src/`
- All tRPC inputs validated with Zod, serialized with SuperJSON
- `publicProcedure` (no auth) vs `protectedProcedure` (session required)
- Prisma generated client: `generated/prisma/` (custom output path)
- Styling: Tailwind CSS v4, `cn()` = clsx + tailwind-merge
- Env vars validated in `src/env.js` via @t3-oss/env-nextjs

## Workflow Rules (MUST follow)

- **Never commit directly to `main`** — always branch → PR → Squash Merge
- Branch naming: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `style/`
- Commit format: `<type>: <description>` (Conventional Commits)
- PR title follows the same commit format
- CI must pass before merge (typecheck + build)
- Delete branch after merge

See [docs/workflow.md](docs/workflow.md) for full workflow details.
