# Architecture

## tRPC (API Layer)

- Routers: `src/server/api/routers/` — tip, category, tag, comment, like, bookmark, project
- Router registry: `src/server/api/root.ts` combines all routers into `appRouter`
- `publicProcedure` — no auth required
- `protectedProcedure` — requires authenticated session (`ctx.session.user`)
- Dev environment adds artificial latency (100-500ms) for realistic testing

## Prisma (Database)

- Schema: `prisma/schema.prisma`
- Generated client: `generated/prisma/` (custom output, not default `node_modules`)
- Database: PostgreSQL
- `postinstall` hook runs `prisma generate` automatically
- Cascade deletes configured via `onDelete: Cascade`
- Tags use `connectOrCreate` for idempotent creation

## Auth (NextAuth v5 beta)

- Config: `src/server/auth/config.ts`
- Provider: GitHub OAuth
- `auth()` wrapped in `React.cache()` — one DB call per request
- Sign-in page: `/auth/signin`
- Protected resources check `ctx.session.user.id` against resource owner

## Frontend

- Next.js App Router with React 19
- Server components use tRPC via `src/trpc/server.ts`
- Client components use React Query hooks: `api.<router>.<procedure>.useQuery()`
- Styling: Tailwind CSS v4 + @tailwindcss/typography
- UI primitives: @base-ui/react (headless), lucide-react (icons)
- Class utility: `cn()` = clsx + tailwind-merge
- Markdown: react-markdown + remark-gfm + rehype-highlight

## Component Structure

- `src/components/ui/` — Base UI components (card, dialog, avatar, etc.)
- `src/components/` — Domain components (tip-card, header, comment-section, etc.)
- Page-specific components live in their route folders

## Key Patterns

- Cursor-based pagination in tRPC queries
- Owner-based authorization: compare `ctx.session.user.id` to resource author
- Environment variables: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `DATABASE_URL` — validated in `src/env.js`
