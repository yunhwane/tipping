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

- Default branch is `master` (serves as production branch)
- **Never commit directly to `master`** — always branch → PR → Squash Merge
- Branch naming: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `style/`
- Commit format: `<type>: <description>` (Conventional Commits)
- PR title follows the same commit format
- CI must pass before merge (typecheck + build)
- Delete branch after merge

See [docs/workflow.md](docs/workflow.md) for full workflow details.

## Feature Request Lifecycle (MUST follow)

When user requests a feature, fix, or change, execute ALL steps in order. Do NOT skip any step.

```
User request
  → Step 1: Create branch from master
  → Step 2: Write requirement doc
  → Step 3: Get user confirmation
  → Step 4: Implement
  → Step 5: Write review doc
  → Step 6: Commit & push branch
  → Step 7: Create PR
```

### Step 1 — Branch
- `git checkout master && git pull origin master`
- `git checkout -b <type>/<feature-name>` (e.g., `feat/bookmark-export`)
- Determine type from request: feature → `feat/`, bug → `fix/`, config → `chore/`

### Step 2 — Requirement doc
- Create `docs/requirements/YYYY-MM-DD-<feature-name>.md`
- Contents: background, requirements, scope, technical approach, affected files

### Step 3 — User confirmation
- Present the requirement doc summary to user
- **Wait for approval before writing any code**

### Step 4 — Implement
- Write code on the feature branch
- Follow Key Conventions above
- Run `npm run typecheck` to verify before committing

### Step 5 — Review doc
- Create `docs/reviews/YYYY-MM-DD-<feature-name>.md`
- Contents: what was implemented, key decisions, files changed, known limitations

### Step 6 — Commit & push
- Stage all changed files (exclude `.env`, credentials, `.claude/`)
- Commit with Conventional Commits format: `<type>: <description>`
- `git push origin <branch-name>`

### Step 7 — Create PR
- PR title: same as commit message
- PR body: use `.github/pull_request_template.md`
- Merge method: Squash and Merge
- Inform user of PR URL
