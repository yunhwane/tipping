# Supabase + Vercel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Tipping app from local PostgreSQL + NextAuth to Supabase (DB, Auth, Storage) + Vercel deployment, while keeping tRPC + Prisma intact.

**Architecture:** Replace NextAuth with Supabase Auth SDK (`@supabase/ssr`), point Prisma at Supabase PostgreSQL with connection pooling, add Supabase Storage for image uploads, and deploy to Vercel. The tRPC layer and all business logic remain unchanged — only the auth context and session handling are rewired.

**Tech Stack:** Next.js 15, tRPC 11, Prisma 6, Supabase (Auth + Storage + PostgreSQL), Vercel, `@supabase/supabase-js`, `@supabase/ssr`

**Spec:** `docs/superpowers/specs/2026-03-25-supabase-vercel-migration-design.md`

---

## File Structure

### New files to create

| File | Responsibility |
|------|---------------|
| `src/lib/supabase/server.ts` | Create Supabase server client (cookie-based, for RSC/API routes) |
| `src/lib/supabase/client.ts` | Create Supabase browser client (for client components) |
| `src/lib/supabase/middleware.ts` | Session refresh utility for Next.js middleware |
| `src/lib/supabase/storage.ts` | Storage upload/delete helpers |
| `src/app/auth/callback/route.ts` | Supabase Auth callback handler (email confirm, OAuth) |
| `src/hooks/use-auth.ts` | Custom hook replacing `useSession` from NextAuth |

### Files to modify

| File | Change |
|------|--------|
| `package.json` | Add supabase packages, remove NextAuth/bcrypt/nodemailer |
| `src/env.ts` | Replace auth/SMTP env vars with Supabase env vars |
| `.env.example` | Update example env vars |
| `prisma/schema.prisma` | Remove NextAuth models, update User, add directUrl |
| `src/server/api/trpc.ts` | Replace NextAuth session with Supabase auth context |
| `src/middleware.ts` | Replace NextAuth middleware with Supabase middleware |
| `src/server/api/routers/auth.ts` | Rewrite: Supabase signUp + Prisma User sync |
| `src/server/api/routers/user.ts` | Remove bcrypt, remove changePassword (Supabase handles) |
| `src/server/api/helpers/content-review.ts` | Update session type to match new context |
| `src/components/providers.tsx` | Remove SessionProvider |
| `src/components/header.tsx` | Replace useSession/signOut with Supabase auth |
| `src/app/auth/signin/page.tsx` | Replace NextAuth signIn with Supabase signInWithPassword |
| `src/app/auth/signup/page.tsx` | Replace tRPC register with Supabase signUp + tRPC sync |
| `src/app/profile/page.tsx` | Replace useSession with custom Supabase hook |
| `src/app/layout.tsx` | Remove Providers wrapper (SessionProvider gone) |
| `.github/workflows/ci.yml` | Update dummy env vars for CI |

### Files to delete

| File | Reason |
|------|--------|
| `src/server/auth/config.ts` | NextAuth configuration |
| `src/server/auth/index.ts` | NextAuth exports |
| `src/lib/email.ts` | Nodemailer (Supabase handles email) |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API route |
| `src/app/auth/verify-email/page.tsx` | Supabase handles email verification |

### Files that reference `useSession` (need updating to custom hook)

All 15 files that import `next-auth/react`:
- `src/components/header.tsx`
- `src/components/comment-section.tsx`
- `src/components/like-button.tsx`
- `src/components/bookmark-button.tsx`
- `src/components/profile-settings.tsx`
- `src/components/providers.tsx`
- `src/app/profile/page.tsx`
- `src/app/profile/settings/page.tsx`
- `src/app/tips/[id]/page.tsx`
- `src/app/tips/[id]/edit/page.tsx`
- `src/app/tips/new/page.tsx`
- `src/app/projects/[id]/page.tsx`
- `src/app/projects/new/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/auth/signin/page.tsx`

---

## Task 1: Install Supabase packages and remove old dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Supabase packages**

```bash
cd /Users/jeonyh/conductor/workspaces/tipping/stuttgart
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Remove NextAuth, bcrypt, nodemailer packages**

```bash
cd /Users/jeonyh/conductor/workspaces/tipping/stuttgart
npm uninstall next-auth @auth/prisma-adapter bcryptjs @types/bcryptjs nodemailer @types/nodemailer
```

- [ ] **Step 3: Verify package.json is clean**

```bash
cd /Users/jeonyh/conductor/workspaces/tipping/stuttgart
cat package.json | grep -E "supabase|next-auth|bcrypt|nodemailer"
```

Expected: Only `@supabase/supabase-js` and `@supabase/ssr` remain.

---

## Task 2: Update environment variables

**Files:**
- Modify: `src/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Update `src/env.ts`**

Replace the entire contents of `src/env.ts` with:

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
```

- [ ] **Step 2: Update `.env.example`**

Replace contents with:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Prisma (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Task 3: Update Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update datasource block**

In `prisma/schema.prisma`, change the datasource block (lines 6-9) to:

```prisma
datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
}
```

- [ ] **Step 2: Remove NextAuth models**

Delete the `Account` model (lines 13-30), `Session` model (lines 32-38), and `VerificationToken` model (lines 40-46), including the comment `// === NextAuth 필수 모델 ===` (line 11).

- [ ] **Step 3: Update User model**

Replace the User model (lines 63-82) with:

```prisma
model User {
    id            String        @id
    name          String?
    email         String        @unique
    image         String?
    bio           String?
    links         Json?
    role          Role          @default(USER)
    tips          Tip[]
    comments      Comment[]
    likes         Like[]
    bookmarks     Bookmark[]
    projects      Project[]
    projectLikes  ProjectLike[]
    notifications Notification[]
}
```

Key changes:
- `id`: Remove `@default(cuid())` — will use Supabase Auth UUID
- `email`: Change from `String?` to `String` (required, always synced from Supabase Auth)
- Remove: `emailVerified`, `password`, `accounts`, `sessions` fields

- [ ] **Step 4: Generate Prisma client**

```bash
cd /Users/jeonyh/conductor/workspaces/tipping/stuttgart
npx prisma generate
```

Expected: Prisma client generated successfully in `generated/prisma/`.

Note: Do NOT run `db:push` yet — that requires a live Supabase database. The schema change is validated by `prisma generate`.

---

## Task 4: Create Supabase client utilities

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create server client — `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 2: Create browser client — `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Create middleware utility — `src/lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabaseResponse };
}
```

---

## Task 5: Rewrite Next.js middleware

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Replace middleware with Supabase version**

Replace the entire contents of `src/middleware.ts` with:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "~/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { user, supabaseResponse } = await updateSession(request);

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Note: Role check cannot be done in middleware without DB access.
    // Admin role is enforced by adminProcedure in tRPC.
    // Client-side redirect is handled by the admin layout.
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

Note: The matcher is broader than before because Supabase needs to refresh tokens on all routes. The `/admin` role check is handled by `adminProcedure` in tRPC on the server side. Additionally, add a client-side redirect in `src/app/admin/layout.tsx` using `useAuth()` to redirect non-admin users to `/` — this prevents non-admins from seeing a broken admin page. The tRPC `adminProcedure` remains the authoritative server-side check.

---

## Task 6: Rewrite tRPC context and procedures

**Files:**
- Modify: `src/server/api/trpc.ts`

- [ ] **Step 1: Replace tRPC context with Supabase auth**

Replace the entire contents of `src/server/api/trpc.ts` with:

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { createClient } from "~/lib/supabase/server";
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  let user: { id: string; name: string | null; email: string; image: string | null; role: string } | null = null;

  if (supabaseUser) {
    const dbUser = await db.user.findUnique({
      where: { id: supabaseUser.id },
      select: { id: true, name: true, email: true, image: true, role: true },
    });
    user = dbUser;
  }

  return {
    db,
    user,
    supabase,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE
 */
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        user: ctx.user,
      },
    });
  });

/**
 * Admin procedure
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
```

Key change: `ctx.session.user` → `ctx.user` throughout. All routers referencing `ctx.session.user.id` must now use `ctx.user.id`.

---

## Task 7: Update all tRPC routers to use `ctx.user` instead of `ctx.session.user`

**Files:**
- Modify: `src/server/api/routers/user.ts`
- Modify: `src/server/api/routers/admin.ts`
- Modify: `src/server/api/routers/tip.ts`
- Modify: `src/server/api/routers/comment.ts`
- Modify: `src/server/api/routers/like.ts`
- Modify: `src/server/api/routers/bookmark.ts`
- Modify: `src/server/api/routers/project.ts`
- Modify: `src/server/api/routers/notification.ts`
- Modify: `src/server/api/helpers/content-review.ts`

- [ ] **Step 1: Global find-and-replace `ctx.session.user` → `ctx.user`**

In every file under `src/server/api/routers/`:
- Replace all occurrences of `ctx.session.user.id` with `ctx.user.id`
- Replace all occurrences of `ctx.session.user.role` with `ctx.user.role`
- Replace all occurrences of `ctx.session.user` with `ctx.user`
- Replace all occurrences of `ctx.session` with `ctx.user` where used as auth check

- [ ] **Step 2: Update `src/server/api/helpers/content-review.ts`**

Change the `checkContentAccess` function signature (line 26-28):

From:
```typescript
export function checkContentAccess(
  content: { status: string; authorId: string },
  session: { user: { id: string; role?: string } } | null,
)
```

To:
```typescript
export function checkContentAccess(
  content: { status: string; authorId: string },
  user: { id: string; role: string } | null,
)
```

And update the body (lines 32-34):
```typescript
  const userId = user?.id;
  const userRole = user?.role;
```

Update all callers — both `tip.ts` and `project.ts` — from `checkContentAccess(tip, ctx.session)` to `checkContentAccess(tip, ctx.user)` and `checkContentAccess(project, ctx.session)` to `checkContentAccess(project, ctx.user)`.

- [ ] **Step 3: Rewrite `src/server/api/routers/auth.ts`**

Replace the entire contents with:

```typescript
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  /**
   * Register: Creates Supabase Auth user + syncs to Prisma User table.
   * Called after client-side Supabase signUp succeeds.
   */
  syncUser: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { id: input.id },
      });

      if (existing) {
        return { success: true, userId: existing.id };
      }

      const user = await ctx.db.user.create({
        data: {
          id: input.id,
          email: input.email,
          name: input.name,
        },
      });

      return { success: true, userId: user.id };
    }),
});
```

- [ ] **Step 4: Rewrite `src/server/api/routers/user.ts`**

Remove bcrypt import and `changePassword` procedure. Update all `ctx.session.user.id` to `ctx.user.id`:

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        links: true,
        role: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" });
    }

    return user;
  }),

  getProfileStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const [tipCount, projectCount, tipLikes, projectLikes] = await Promise.all([
      ctx.db.tip.count({
        where: { authorId: userId, status: "APPROVED" },
      }),
      ctx.db.project.count({
        where: { authorId: userId, status: "APPROVED" },
      }),
      ctx.db.like.count({
        where: { tip: { authorId: userId } },
      }),
      ctx.db.projectLike.count({
        where: { project: { authorId: userId } },
      }),
    ]);

    return {
      tipCount,
      projectCount,
      totalLikes: tipLikes + projectLikes,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(2, "닉네임은 2자 이상이어야 합니다")
          .max(20, "닉네임은 20자 이하여야 합니다")
          .transform((v) => v.trim())
          .optional(),
        image: z.string().url("올바른 URL이어야 합니다").optional(),
        bio: z
          .string()
          .max(100, "한줄 소개는 100자 이하여야 합니다")
          .transform((v) => v.trim() || null)
          .nullish(),
        links: z
          .array(
            z.object({
              label: z.string().min(1).max(20).transform((v) => v.trim()),
              url: z
                .string()
                .url("올바른 URL이어야 합니다")
                .refine(
                  (url) => /^https?:\/\//.test(url),
                  "HTTP(S) URL만 허용됩니다",
                ),
            }),
          )
          .max(5)
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: {
        name?: string;
        image?: string;
        bio?: string | null;
        links?: { label: string; url: string }[];
      } = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.image !== undefined) data.image = input.image;
      if (input.bio !== undefined) data.bio = input.bio;
      if (input.links !== undefined) data.links = input.links;

      const user = await ctx.db.user.update({
        where: { id: ctx.user.id },
        data,
        select: { id: true, name: true, email: true, image: true, bio: true, links: true },
      });

      return user;
    }),
});
```

Note: `changePassword` is removed — Supabase Auth handles password changes via `supabase.auth.updateUser({ password })` on the client side.

- [ ] **Step 5: Verify trpc client files don't need changes**

Check `src/trpc/server.ts` and `src/trpc/react.tsx` — these files call `createTRPCContext` but don't directly import auth. Since `createTRPCContext` signature (`{ headers: Headers }`) is unchanged, these files should not need modification. Verify this.

- [ ] **Step 6: Verify all routers compile**

```bash
cd /Users/jeonyh/conductor/workspaces/tipping/stuttgart
npx tsc --noEmit 2>&1 | head -50
```

Fix any remaining `ctx.session` references until typecheck passes.

---

## Task 8: Create auth hook and update all client components

**Files:**
- Create: `src/hooks/use-auth.ts`
- Modify: `src/components/providers.tsx`
- Modify: `src/app/layout.tsx`
- Modify: All 15 files importing `next-auth/react`

- [ ] **Step 1: Create `src/hooks/use-auth.ts`**

This hook uses tRPC's React Query integration (via `api.user.getProfile.useQuery`) instead of raw `fetch` to properly handle SuperJSON deserialization and cookie-based auth.

```typescript
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "~/lib/supabase/client";
import { api } from "~/trpc/react";

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string;
}

interface AuthSession {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

export function useAuth(): AuthSession {
  const [supabaseUserId, setSupabaseUserId] = useState<string | null | undefined>(undefined);
  const [supabaseEmail, setSupabaseEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUserId(user?.id ?? null);
      setSupabaseEmail(user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUserId(session?.user?.id ?? null);
      setSupabaseEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!supabaseUserId;

  // Use tRPC query for DB user profile (only when authenticated)
  const { data: profile, isLoading: profileLoading } = api.user.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  return useMemo(() => {
    // Still loading Supabase auth state
    if (supabaseUserId === undefined) {
      return { user: null, status: "loading" as const };
    }

    // Not authenticated
    if (!supabaseUserId) {
      return { user: null, status: "unauthenticated" as const };
    }

    // Authenticated, profile loaded
    if (profile) {
      return {
        user: {
          id: supabaseUserId,
          email: supabaseEmail ?? profile.email,
          name: profile.name,
          image: profile.image,
          role: profile.role,
        },
        status: "authenticated" as const,
      };
    }

    // Authenticated but profile still loading
    if (profileLoading) {
      return {
        user: {
          id: supabaseUserId,
          email: supabaseEmail ?? "",
        },
        status: "authenticated" as const,
      };
    }

    // Authenticated, profile failed to load (fallback)
    return {
      user: {
        id: supabaseUserId,
        email: supabaseEmail ?? "",
      },
      status: "authenticated" as const,
    };
  }, [supabaseUserId, supabaseEmail, profile, profileLoading]);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/";
}
```

- [ ] **Step 2: Update `src/app/layout.tsx` and delete `src/components/providers.tsx`**

`providers.tsx` only wraps `SessionProvider` which is being removed. Delete it and remove from layout.



Remove the Providers import and wrapper:

```typescript
import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Header } from "~/components/header";

export const metadata: Metadata = {
  title: "Tipping — IT/개발 팁 공유 커뮤니티",
  description: "한국 개발자를 위한 카테고리별 IT/개발 팁 공유 플랫폼",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Update `src/components/header.tsx`**

Replace NextAuth imports with Supabase auth hook:

```typescript
"use client";

import Link from "next/link";
import { useAuth, signOut } from "~/hooks/use-auth";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { SearchBar } from "./search-bar";
import { Lightbulb, LogIn, UserPlus } from "lucide-react";
import { NotificationBell } from "./notification-bell";

export function Header() {
  const { user: session, status } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5 text-xl font-bold">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Tipping
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/tips"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              팁
            </Link>
            <Link
              href="/projects"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              프로젝트
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <SearchBar />

          {status === "loading" ? null : session ? (
            <>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={session.image ?? ""}
                    alt={session.name ?? ""}
                  />
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-semibold">
                    {session.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/profile" className="w-full">내 프로필</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/tips/new" className="w-full">팁 작성</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/projects/new" className="w-full">프로젝트 등록</Link>
                </DropdownMenuItem>
                {session.role === "ADMIN" && (
                  <DropdownMenuItem>
                    <Link href="/admin" className="w-full">관리자</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()}>
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/auth/signin">
                <Button variant="outline" className="h-9 gap-2 px-4 text-sm font-medium">
                  <LogIn className="h-4 w-4" />
                  로그인
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="h-9 gap-2 bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600">
                  <UserPlus className="h-4 w-4" />
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Update all remaining files importing `next-auth/react`**

For each of the remaining ~12 files that use `useSession` from `next-auth/react`:
1. Replace `import { useSession } from "next-auth/react"` with `import { useAuth } from "~/hooks/use-auth"`
2. Replace `const { data: session, status } = useSession()` with `const { user: session, status } = useAuth()`
3. Replace `const { data: session } = useSession()` with `const { user: session } = useAuth()`
4. If `signOut` is imported, replace with `import { signOut } from "~/hooks/use-auth"`

Files to update:
- `src/components/comment-section.tsx`
- `src/components/like-button.tsx`
- `src/components/bookmark-button.tsx`
- `src/components/profile-settings.tsx`
- `src/app/profile/page.tsx`
- `src/app/profile/settings/page.tsx`
- `src/app/tips/[id]/page.tsx`
- `src/app/tips/[id]/edit/page.tsx`
- `src/app/tips/new/page.tsx`
- `src/app/projects/[id]/page.tsx`
- `src/app/projects/new/page.tsx`
- `src/app/admin/users/page.tsx`

For `src/app/profile/page.tsx` specifically, also change:
- `if (!session) redirect("/api/auth/signin")` → `if (!session) redirect("/auth/signin")`

---

## Task 9: Rewrite auth pages

**Files:**
- Modify: `src/app/auth/signin/page.tsx`
- Modify: `src/app/auth/signup/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Delete: `src/app/auth/verify-email/page.tsx`

- [ ] **Step 1: Rewrite `src/app/auth/signin/page.tsx`**

Replace the entire file. The key change: use Supabase `signInWithPassword` instead of NextAuth `signIn`:

```typescript
"use client";

import { useState } from "react";
import { createClient } from "~/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Lightbulb, Loader2, Mail, Lock, AlertCircle } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError("이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.");
        } else {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* 로고 영역 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
            <Lightbulb className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">다시 오신 걸 환영합니다</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tipping에 로그인하고 팁을 공유하세요
          </p>
        </div>

        {/* 폼 */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-10 w-full bg-amber-500 font-semibold text-white hover:bg-amber-600"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              로그인
            </Button>
          </form>
        </div>

        {/* 하단 링크 */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link href="/auth/signup" className="font-semibold text-amber-600 hover:text-amber-500 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `src/app/auth/signup/page.tsx`**

Replace the entire file. Key change: use Supabase `signUp` + tRPC `auth.syncUser` to create Prisma User:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Lightbulb,
  Loader2,
  CheckCircle,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { api } from "~/trpc/react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const syncUser = api.auth.syncUser.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        // Sync user to Prisma DB
        await syncUser.mutateAsync({
          id: data.user.id,
          email,
          name,
        });
      }

      setSuccess(true);
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-[400px] text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">인증 메일을 보냈습니다</h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{email}</span>
            으로 인증 메일을 발송했습니다.
            <br />
            메일함을 확인하고 인증 링크를 클릭해주세요.
          </p>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>메일이 도착하지 않았나요?</span>
            </div>
            <ul className="space-y-1.5 text-left text-xs text-muted-foreground">
              <li>- 스팸 폴더를 확인해보세요</li>
              <li>- 이메일 주소가 정확한지 확인해보세요</li>
              <li>- 몇 분 후 다시 시도해보세요</li>
            </ul>
          </div>
          <Link href="/auth/signin" className="mt-6 inline-block">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              로그인 페이지로 이동
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* 로고 영역 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
            <Lightbulb className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">회원가입</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tipping에 가입하고 개발 팁을 공유하세요
          </p>
        </div>

        {/* 폼 */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                이름
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="영문 + 숫자 포함 8자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="passwordConfirm" className="text-sm font-medium">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-10 w-full bg-amber-500 font-semibold text-white hover:bg-amber-600"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              회원가입
            </Button>
          </form>
        </div>

        {/* 하단 링크 */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/signin" className="font-semibold text-amber-600 hover:text-amber-500 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/auth/callback/route.ts`**

This handles the Supabase email confirmation callback. Note: The Prisma User is created at signup time (before email confirmation), not here. This is intentional — Supabase returns a user UUID immediately on `signUp`, and we need the Prisma User to exist when the user first logs in after confirmation. Orphaned rows from unconfirmed signups are acceptable at this scale.

```typescript
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code error — redirect to signin with error
  return NextResponse.redirect(`${origin}/auth/signin`);
}
```

- [ ] **Step 4: Delete old auth files**

```bash
cd /Users/jeonyh/conductor/workspaces/tipping/stuttgart
rm -rf src/server/auth/
rm -f src/lib/email.ts
rm -rf src/app/api/auth/
rm -f src/app/auth/verify-email/page.tsx
rm -f src/components/providers.tsx
```

---

## Task 10: Add Supabase Storage utilities

**Files:**
- Create: `src/lib/supabase/storage.ts`

- [ ] **Step 1: Create storage utility**

```typescript
import { createClient } from "./client";

const BUCKETS = {
  avatars: "avatars",
  tips: "tips",
  projects: "projects",
} as const;

type BucketName = keyof typeof BUCKETS;

export async function uploadImage(
  bucket: BucketName,
  userId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const timestamp = Date.now();
  const ext = file.name.split(".").pop();
  const path = `${userId}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKETS[bucket])
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKETS[bucket])
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteImage(
  bucket: BucketName,
  path: string,
): Promise<void> {
  const supabase = createClient();

  // Extract path from full URL if needed
  const urlPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKETS[bucket]}/`;
  const filePath = path.startsWith("http")
    ? path.replace(urlPrefix, "")
    : path;

  const { error } = await supabase.storage
    .from(BUCKETS[bucket])
    .remove([filePath]);

  if (error) throw error;
}
```

Note: Storage buckets must be created manually in the Supabase Dashboard with the following RLS policies:
- **Read**: Public (all users)
- **Insert**: Authenticated users only (`auth.uid()` is not null)
- **Delete**: Owner only (`auth.uid()::text = (storage.foldername(name))[1]`)

---

## Task 11: Update CI and final cleanup

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Update CI environment variables**

Replace the env section in `.github/workflows/ci.yml`:

```yaml
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy
          DIRECT_URL: postgresql://dummy:dummy@localhost:5432/dummy
          SKIP_ENV_VALIDATION: true
```

Remove `AUTH_SECRET` from CI env.

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/jeonyh/conductor/workspaces/tipping/stuttgart
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Run build**

```bash
cd /Users/jeonyh/conductor/workspaces/tipping/stuttgart
SKIP_ENV_VALIDATION=true npm run build
```

Expected: Build succeeds. (Will show warnings about missing env vars but should not fail with SKIP_ENV_VALIDATION.)

---

## Task 12: Commit all changes

- [ ] **Step 1: Commit — packages and env**

```bash
git add package.json package-lock.json src/env.ts .env.example
git commit -m "chore: supabase 패키지 설치 및 환경 설정"
```

**Recommended approach:** Commits 1-3 (packages + schema + auth) are tightly coupled and cannot compile independently. Combine them into a single commit: `refactor: supabase auth로 인증 전환 (패키지, 스키마, auth 통합)`. This avoids broken intermediate states. Commits 4-5 (storage, CI) can remain separate as they are independently compilable.

- [ ] **Step 2: Commit — Prisma schema**

```bash
git add prisma/schema.prisma generated/
git commit -m "refactor: prisma 스키마 supabase auth 대응"
```

- [ ] **Step 3: Commit — Auth migration**

```bash
git add src/lib/supabase/ src/hooks/ src/middleware.ts src/server/api/ src/components/ src/app/auth/ src/app/profile/ src/app/layout.tsx src/app/tips/ src/app/projects/ src/app/admin/
git commit -m "refactor: supabase auth로 인증 전환"
```

Also include deleted files (`src/server/auth/`, `src/lib/email.ts`, `src/app/api/auth/`, `src/components/providers.tsx`).

- [ ] **Step 4: Commit — Storage**

```bash
git add src/lib/supabase/storage.ts
git commit -m "feat: supabase storage 이미지 업로드 추가"
```

- [ ] **Step 5: Commit — CI and deployment config**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: vercel 배포 설정 및 CI 업데이트"
```

- [ ] **Step 6: Push and create PR**

```bash
git push origin yunhwane/supabase-vercel-migration
```

---

## Implementation Notes

### Supabase Dashboard Setup (Manual, before testing)

1. Create a Supabase project at https://supabase.com
2. Get connection strings from Settings → Database
3. Create Storage buckets: `avatars`, `tips`, `projects` (all public)
4. Set bucket policies per Task 10 notes
5. Copy env vars to `.env` file
6. Run `npx prisma db push` to sync schema

### Vercel Setup (Manual, after PR merge)

1. Import repository from GitHub
2. Set environment variables in Vercel Dashboard
3. Enable GitHub integration for PR preview deployments
4. Verify build succeeds with `prisma generate && next build`
