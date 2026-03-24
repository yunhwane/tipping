# Tipping 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한국 개발자를 위한 IT/개발 팁 공유 커뮤니티 MVP를 구축한다.

**Architecture:** create-t3-app 기반 풀스택 앱. Next.js App Router + tRPC로 타입 안전한 API, Prisma + PostgreSQL로 데이터 관리, NextAuth로 GitHub 소셜 로그인, shadcn/ui로 UI 구성.

**Tech Stack:** Next.js 14 (App Router), tRPC, React Query, Prisma, PostgreSQL, NextAuth.js, Tailwind CSS, shadcn/ui, TypeScript

**Spec:** `.claude/design.md`

---

## 파일 구조 (예상)

```
tipping/
├── prisma/
│   ├── schema.prisma          # 데이터 모델 정의
│   └── seed.ts                # 시드 데이터 (카테고리 등)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 루트 레이아웃 (헤더, Provider)
│   │   ├── page.tsx           # 홈페이지
│   │   ├── tips/
│   │   │   ├── page.tsx       # 팁 목록
│   │   │   ├── new/page.tsx   # 팁 작성
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # 팁 상세
│   │   │       └── edit/page.tsx # 팁 수정
│   │   ├── category/
│   │   │   └── [slug]/page.tsx # 카테고리별 팁
│   │   ├── tag/
│   │   │   └── [name]/page.tsx # 태그별 팁
│   │   ├── projects/
│   │   │   ├── page.tsx       # 프로젝트 목록
│   │   │   ├── new/page.tsx   # 프로젝트 등록
│   │   │   └── [id]/page.tsx  # 프로젝트 상세
│   │   ├── profile/
│   │   │   └── page.tsx       # 내 프로필
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── trpc/[trpc]/route.ts
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts        # tRPC 루트 라우터
│   │   │   ├── trpc.ts        # tRPC 초기화 (context, procedures)
│   │   │   └── routers/
│   │   │       ├── tip.ts
│   │   │       ├── comment.ts
│   │   │       ├── like.ts
│   │   │       ├── bookmark.ts
│   │   │       ├── category.ts
│   │   │       ├── tag.ts
│   │   │       └── project.ts
│   │   ├── auth.ts            # NextAuth 설정
│   │   └── db.ts              # Prisma 클라이언트
│   ├── components/
│   │   ├── ui/                # shadcn/ui 컴포넌트
│   │   ├── header.tsx         # 글로벌 헤더
│   │   ├── tip-card.tsx       # 팁 카드
│   │   ├── tip-form.tsx       # 팁 작성/수정 폼
│   │   ├── comment-section.tsx # 댓글 영역
│   │   ├── like-button.tsx    # 좋아요 버튼
│   │   ├── bookmark-button.tsx # 북마크 버튼
│   │   ├── search-bar.tsx     # 검색바
│   │   ├── category-nav.tsx   # 카테고리 네비게이션
│   │   ├── tag-badge.tsx      # 태그 뱃지
│   │   ├── project-card.tsx   # 프로젝트 카드
│   │   └── project-form.tsx   # 프로젝트 등록 폼
│   ├── lib/
│   │   └── utils.ts           # 유틸리티 함수
│   └── trpc/
│       ├── react.tsx          # tRPC React 클라이언트
│       └── server.ts          # tRPC 서버 호출 헬퍼
└── .env                       # 환경변수
```

---

## Task 1: 프로젝트 스캐폴딩

**목표:** create-t3-app으로 프로젝트 생성 및 기본 설정 확인

- [ ] **Step 1: create-t3-app으로 프로젝트 생성**

```bash
npx create-t3-app@latest tipping --noGit \
  --CI \
  --trpc \
  --tailwind \
  --nextAuth \
  --prisma \
  --appRouter \
  --dbProvider postgresql
```

> 이미 git이 초기화되어 있으므로 `--noGit` 사용. 생성된 파일들을 현재 디렉토리로 이동.

- [ ] **Step 2: shadcn/ui 초기화**

```bash
npx shadcn@latest init
```

기본 설정: New York style, Zinc color, CSS variables 사용

- [ ] **Step 3: 자주 사용할 shadcn/ui 컴포넌트 추가**

```bash
npx shadcn@latest add button card input textarea badge avatar dropdown-menu dialog tabs separator
```

- [ ] **Step 4: .env 설정**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tipping"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

- [ ] **Step 5: 개발 서버 실행 확인**

```bash
npm run dev
```

Expected: localhost:3000에서 T3 기본 페이지가 뜸

- [ ] **Step 6: 커밋**

```bash
git add .
git commit -m "chore: scaffold project with create-t3-app and shadcn/ui"
```

---

## Task 2: Prisma 스키마 정의

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Prisma 스키마에 모든 모델 작성**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// === NextAuth 필수 모델 ===
model Account {
  id                       String  @id @default(cuid())
  userId                   String
  type                     String
  provider                 String
  providerAccountId        String
  refresh_token            String? @db.Text
  access_token             String? @db.Text
  expires_at               Int?
  token_type               String?
  scope                    String?
  id_token                 String? @db.Text
  session_state            String?
  user                     User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// === 도메인 모델 ===
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  tips          Tip[]
  comments      Comment[]
  likes         Like[]
  bookmarks     Bookmark[]
  projects      Project[]
  projectLikes  ProjectLike[]
}

model TopCategory {
  id         String     @id @default(cuid())
  name       String
  slug       String     @unique
  categories Category[]
}

model Category {
  id            String      @id @default(cuid())
  name          String
  slug          String      @unique
  description   String?
  topCategoryId String
  topCategory   TopCategory @relation(fields: [topCategoryId], references: [id])
  tips          Tip[]
}

model Tag {
  id       String    @id @default(cuid())
  name     String    @unique
  tips     Tip[]     @relation("TipTags")
  projects Project[] @relation("ProjectTags")
}

model Tip {
  id         String     @id @default(cuid())
  title      String
  content    String     @db.Text
  viewCount  Int        @default(0)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  authorId   String
  categoryId String
  author     User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category   Category   @relation(fields: [categoryId], references: [id])
  tags       Tag[]      @relation("TipTags")
  comments   Comment[]
  likes      Like[]
  bookmarks  Bookmark[]

  @@index([authorId])
  @@index([categoryId])
  @@index([createdAt])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  authorId  String
  tipId     String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tip       Tip      @relation(fields: [tipId], references: [id], onDelete: Cascade)

  @@index([tipId])
}

model Like {
  userId    String
  tipId     String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tip       Tip      @relation(fields: [tipId], references: [id], onDelete: Cascade)

  @@id([userId, tipId])
}

model Bookmark {
  userId    String
  tipId     String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tip       Tip      @relation(fields: [tipId], references: [id], onDelete: Cascade)

  @@id([userId, tipId])
}

model Project {
  id          String        @id @default(cuid())
  title       String
  description String        @db.Text
  url         String?
  imageUrl    String?
  viewCount   Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  authorId    String
  author      User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tags        Tag[]         @relation("ProjectTags")
  likes       ProjectLike[]

  @@index([authorId])
  @@index([createdAt])
}

model ProjectLike {
  userId    String
  projectId String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@id([userId, projectId])
}
```

- [ ] **Step 2: 마이그레이션 실행**

```bash
npx prisma migrate dev --name init
```

Expected: Migration `init` 생성 및 적용 성공

- [ ] **Step 3: Prisma Client 생성 확인**

```bash
npx prisma generate
```

- [ ] **Step 4: 커밋**

```bash
git add prisma/
git commit -m "feat: define Prisma schema with all domain models"
```

---

## Task 3: 시드 데이터

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (prisma seed 스크립트)

- [ ] **Step 1: seed.ts 작성**

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 상위 카테고리
  const itDev = await prisma.topCategory.upsert({
    where: { slug: "it-dev" },
    update: {},
    create: { name: "IT/개발", slug: "it-dev" },
  });

  // 하위 카테고리
  const categories = [
    { name: "Frontend", slug: "frontend", description: "프론트엔드 개발 팁" },
    { name: "Backend", slug: "backend", description: "백엔드 개발 팁" },
    { name: "DevOps", slug: "devops", description: "DevOps & 인프라 팁" },
    { name: "Database", slug: "database", description: "데이터베이스 팁" },
    { name: "Mobile", slug: "mobile", description: "모바일 개발 팁" },
    { name: "AI/ML", slug: "ai-ml", description: "AI/ML 팁" },
    { name: "기타", slug: "etc", description: "기타 IT 관련 팁" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, topCategoryId: itDev.id },
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: package.json에 seed 설정 추가**

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

```bash
npm install -D tsx
```

- [ ] **Step 3: 시드 실행**

```bash
npx prisma db seed
```

Expected: "Seed completed" 출력

- [ ] **Step 4: 커밋**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed data for categories"
```

---

## Task 4: NextAuth GitHub 인증 설정

**Files:**
- Modify: `src/server/auth.ts` (T3 기본 생성 파일 수정)

- [ ] **Step 1: auth.ts에 GitHub Provider 설정**

T3가 생성한 `src/server/auth.ts`에서 DiscordProvider를 GitHubProvider로 교체:

```typescript
import GitHubProvider from "next-auth/providers/github";

// providers 배열에서 Discord → GitHub로 변경
providers: [
  GitHubProvider({
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  }),
],
```

- [ ] **Step 2: env 스키마에 GitHub 환경변수 추가**

`src/env.js` (또는 `src/env.mjs`)에서 Discord 관련 env를 GitHub으로 교체:

```typescript
GITHUB_CLIENT_ID: z.string(),
GITHUB_CLIENT_SECRET: z.string(),
```

- [ ] **Step 3: 로그인 동작 확인**

```bash
npm run dev
```

localhost:3000에서 로그인 버튼 클릭 → GitHub OAuth 페이지 → 콜백 → 세션 생성 확인

- [ ] **Step 4: 커밋**

```bash
git add src/server/auth.ts src/env.js
git commit -m "feat: configure GitHub OAuth via NextAuth"
```

---

## Task 5: tRPC 라우터 — category, tag

**Files:**
- Create: `src/server/api/routers/category.ts`
- Create: `src/server/api/routers/tag.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: category 라우터 작성**

```typescript
// src/server/api/routers/category.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      include: {
        topCategory: true,
        _count: { select: { tips: true } },
      },
      orderBy: { name: "asc" },
    });
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.category.findUnique({
        where: { slug: input.slug },
        include: { topCategory: true },
      });
    }),
});
```

- [ ] **Step 2: tag 라우터 작성**

```typescript
// src/server/api/routers/tag.ts
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const tagRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      include: { _count: { select: { tips: true } } },
      orderBy: { name: "asc" },
    });
  }),

  getPopular: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      include: { _count: { select: { tips: true } } },
      orderBy: { tips: { _count: "desc" } },
      take: 20,
    });
  }),
});
```

- [ ] **Step 3: root.ts에 라우터 등록**

```typescript
import { categoryRouter } from "./routers/category";
import { tagRouter } from "./routers/tag";

export const appRouter = createTRPCRouter({
  category: categoryRouter,
  tag: tagRouter,
});
```

- [ ] **Step 4: 커밋**

```bash
git add src/server/api/routers/category.ts src/server/api/routers/tag.ts src/server/api/root.ts
git commit -m "feat: add category and tag tRPC routers"
```

---

## Task 6: tRPC 라우터 — tip (CRUD + 검색 + 인기순)

**Files:**
- Create: `src/server/api/routers/tip.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: tip 라우터 작성**

```typescript
// src/server/api/routers/tip.ts
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const tipRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
        categorySlug: z.string().optional(),
        tagName: z.string().optional(),
        sortBy: z.enum(["latest", "popular"]).default("latest"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, categorySlug, tagName, sortBy } = input;

      const where = {
        ...(categorySlug && { category: { slug: categorySlug } }),
        ...(tagName && { tags: { some: { name: tagName } } }),
      };

      const orderBy =
        sortBy === "popular"
          ? [{ likes: { _count: "desc" as const } }, { viewCount: "desc" as const }]
          : [{ createdAt: "desc" as const }];

      const items = await ctx.db.tip.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: true,
          tags: true,
          _count: { select: { likes: true, comments: true } },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tip = await ctx.db.tip.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: true,
          tags: true,
          _count: { select: { likes: true, comments: true, bookmarks: true } },
        },
      });
      return tip;
    }),

  getPopular: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tip.findMany({
        take: input.limit,
        orderBy: [{ likes: { _count: "desc" } }, { viewCount: "desc" }],
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: true,
          tags: true,
          _count: { select: { likes: true, comments: true } },
        },
      });
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tip.findMany({
        where: {
          OR: [
            { title: { contains: input.query, mode: "insensitive" } },
            { content: { contains: input.query, mode: "insensitive" } },
          ],
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: true,
          tags: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        categoryId: z.string(),
        tagNames: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tip.create({
        data: {
          title: input.title,
          content: input.content,
          authorId: ctx.session.user.id,
          categoryId: input.categoryId,
          tags: {
            connectOrCreate: input.tagNames.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        categoryId: z.string(),
        tagNames: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tip = await ctx.db.tip.findUnique({ where: { id: input.id } });
      if (!tip || tip.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.tip.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
          categoryId: input.categoryId,
          tags: {
            set: [],
            connectOrCreate: input.tagNames.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tip = await ctx.db.tip.findUnique({ where: { id: input.id } });
      if (!tip || tip.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.tip.delete({ where: { id: input.id } });
    }),
});
```

- [ ] **Step 2: root.ts에 tip 라우터 등록**

```typescript
import { tipRouter } from "./routers/tip";
// appRouter에 추가:
tip: tipRouter,
```

- [ ] **Step 3: 커밋**

```bash
git add src/server/api/routers/tip.ts src/server/api/root.ts
git commit -m "feat: add tip tRPC router with CRUD, search, and popular"
```

---

## Task 7: tRPC 라우터 — comment, like, bookmark

**Files:**
- Create: `src/server/api/routers/comment.ts`
- Create: `src/server/api/routers/like.ts`
- Create: `src/server/api/routers/bookmark.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: comment 라우터 작성**

```typescript
// src/server/api/routers/comment.ts
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const commentRouter = createTRPCRouter({
  getByTipId: publicProcedure
    .input(z.object({ tipId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.comment.findMany({
        where: { tipId: input.tipId },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        tipId: z.string(),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.comment.create({
        data: {
          content: input.content,
          tipId: input.tipId,
          authorId: ctx.session.user.id,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({ where: { id: input.id } });
      if (!comment || comment.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.comment.delete({ where: { id: input.id } });
    }),
});
```

- [ ] **Step 2: like 라우터 작성**

```typescript
// src/server/api/routers/like.ts
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const likeRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ tipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.like.findUnique({
        where: {
          userId_tipId: {
            userId: ctx.session.user.id,
            tipId: input.tipId,
          },
        },
      });

      if (existing) {
        await ctx.db.like.delete({
          where: {
            userId_tipId: {
              userId: ctx.session.user.id,
              tipId: input.tipId,
            },
          },
        });
        return { liked: false };
      }

      await ctx.db.like.create({
        data: {
          userId: ctx.session.user.id,
          tipId: input.tipId,
        },
      });
      return { liked: true };
    }),

  getStatus: protectedProcedure
    .input(z.object({ tipId: z.string() }))
    .query(async ({ ctx, input }) => {
      const like = await ctx.db.like.findUnique({
        where: {
          userId_tipId: {
            userId: ctx.session.user.id,
            tipId: input.tipId,
          },
        },
      });
      return { liked: !!like };
    }),

  getCount: publicProcedure
    .input(z.object({ tipId: z.string() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.like.count({
        where: { tipId: input.tipId },
      });
      return { count };
    }),
});
```

- [ ] **Step 3: bookmark 라우터 작성**

```typescript
// src/server/api/routers/bookmark.ts
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const bookmarkRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ tipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.bookmark.findUnique({
        where: {
          userId_tipId: {
            userId: ctx.session.user.id,
            tipId: input.tipId,
          },
        },
      });

      if (existing) {
        await ctx.db.bookmark.delete({
          where: {
            userId_tipId: {
              userId: ctx.session.user.id,
              tipId: input.tipId,
            },
          },
        });
        return { bookmarked: false };
      }

      await ctx.db.bookmark.create({
        data: {
          userId: ctx.session.user.id,
          tipId: input.tipId,
        },
      });
      return { bookmarked: true };
    }),

  getStatus: protectedProcedure
    .input(z.object({ tipId: z.string() }))
    .query(async ({ ctx, input }) => {
      const bookmark = await ctx.db.bookmark.findUnique({
        where: {
          userId_tipId: {
            userId: ctx.session.user.id,
            tipId: input.tipId,
          },
        },
      });
      return { bookmarked: !!bookmark };
    }),

  getMyBookmarks: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.bookmark.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        tip: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            category: true,
            tags: true,
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),
});
```

- [ ] **Step 4: root.ts에 모든 라우터 등록**

```typescript
import { commentRouter } from "./routers/comment";
import { likeRouter } from "./routers/like";
import { bookmarkRouter } from "./routers/bookmark";

// appRouter에 추가:
comment: commentRouter,
like: likeRouter,
bookmark: bookmarkRouter,
```

- [ ] **Step 5: 커밋**

```bash
git add src/server/api/routers/comment.ts src/server/api/routers/like.ts src/server/api/routers/bookmark.ts src/server/api/root.ts
git commit -m "feat: add comment, like, bookmark tRPC routers"
```

---

## Task 8: tRPC 라우터 — project

**Files:**
- Create: `src/server/api/routers/project.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: project 라우터 작성**

```typescript
// src/server/api/routers/project.ts
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const items = await ctx.db.project.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: true,
          _count: { select: { likes: true } },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: true,
          _count: { select: { likes: true } },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1),
        url: z.string().url().optional(),
        imageUrl: z.string().url().optional(),
        tagNames: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: {
          title: input.title,
          description: input.description,
          url: input.url,
          imageUrl: input.imageUrl,
          authorId: ctx.session.user.id,
          tags: {
            connectOrCreate: input.tagNames.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().min(1),
        url: z.string().url().optional(),
        imageUrl: z.string().url().optional(),
        tagNames: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({ where: { id: input.id } });
      if (!project || project.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.project.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          url: input.url,
          imageUrl: input.imageUrl,
          tags: {
            set: [],
            connectOrCreate: input.tagNames.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({ where: { id: input.id } });
      if (!project || project.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.project.delete({ where: { id: input.id } });
    }),

  toggleLike: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.projectLike.findUnique({
        where: {
          userId_projectId: {
            userId: ctx.session.user.id,
            projectId: input.projectId,
          },
        },
      });

      if (existing) {
        await ctx.db.projectLike.delete({
          where: {
            userId_projectId: {
              userId: ctx.session.user.id,
              projectId: input.projectId,
            },
          },
        });
        return { liked: false };
      }

      await ctx.db.projectLike.create({
        data: {
          userId: ctx.session.user.id,
          projectId: input.projectId,
        },
      });
      return { liked: true };
    }),
});
```

- [ ] **Step 2: root.ts에 등록**

```typescript
import { projectRouter } from "./routers/project";
// appRouter에 추가:
project: projectRouter,
```

- [ ] **Step 3: 커밋**

```bash
git add src/server/api/routers/project.ts src/server/api/root.ts
git commit -m "feat: add project tRPC router with CRUD and like"
```

---

## Task 9: 공통 UI 컴포넌트 — Header, CategoryNav, SearchBar

**Files:**
- Create: `src/components/header.tsx`
- Create: `src/components/category-nav.tsx`
- Create: `src/components/search-bar.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Header 컴포넌트 작성**

로고, 검색바, 카테고리 네비게이션, 로그인/프로필 드롭다운 포함. `next-auth/react`의 `useSession`, `signIn`, `signOut` 사용.

- [ ] **Step 2: CategoryNav 컴포넌트 작성**

`api.category.getAll`로 카테고리 목록을 가져와 수평 네비게이션으로 표시. 현재 선택된 카테고리 하이라이트.

- [ ] **Step 3: SearchBar 컴포넌트 작성**

입력 → debounce → `/tips?q=검색어`로 라우팅. shadcn/ui `Input` 사용.

- [ ] **Step 4: layout.tsx에 Header 배치**

```tsx
<Header />
<main className="container mx-auto px-4 py-8">
  {children}
</main>
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/header.tsx src/components/category-nav.tsx src/components/search-bar.tsx src/app/layout.tsx
git commit -m "feat: add header, category nav, and search bar components"
```

---

## Task 10: 팁 카드 & 뱃지 컴포넌트

**Files:**
- Create: `src/components/tip-card.tsx`
- Create: `src/components/tag-badge.tsx`

- [ ] **Step 1: TagBadge 컴포넌트 작성**

shadcn/ui `Badge` 래핑. 클릭 시 `/tag/[name]`으로 이동.

- [ ] **Step 2: TipCard 컴포넌트 작성**

shadcn/ui `Card` 기반. 제목, 카테고리 뱃지, 태그들, 좋아요 수, 댓글 수, 조회수, 작성자 아바타+이름, 작성일 표시. 클릭 시 `/tips/[id]`로 이동.

- [ ] **Step 3: 커밋**

```bash
git add src/components/tip-card.tsx src/components/tag-badge.tsx
git commit -m "feat: add tip card and tag badge components"
```

---

## Task 11: 홈페이지

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 홈페이지 구현**

히어로 섹션 (서비스 소개 + CTA), 인기 팁 섹션 (`tip.getPopular`), 최신 팁 섹션 (`tip.getAll` latest), 카테고리 카드 그리드 (`category.getAll`). TipCard 컴포넌트 재사용.

- [ ] **Step 2: 커밋**

```bash
git add src/app/page.tsx
git commit -m "feat: implement homepage with popular tips and categories"
```

---

## Task 12: 팁 목록 페이지

**Files:**
- Create: `src/app/tips/page.tsx`

- [ ] **Step 1: 팁 목록 페이지 구현**

정렬 토글 (최신순/인기순), 카테고리 필터 (쿼리 파라미터), 검색 결과 표시, TipCard 그리드, 무한 스크롤 또는 "더 보기" 버튼 (cursor 기반 페이지네이션).

- [ ] **Step 2: 커밋**

```bash
git add src/app/tips/page.tsx
git commit -m "feat: implement tips list page with filtering and sorting"
```

---

## Task 13: 팁 상세 페이지

**Files:**
- Create: `src/app/tips/[id]/page.tsx`
- Create: `src/components/like-button.tsx`
- Create: `src/components/bookmark-button.tsx`
- Create: `src/components/comment-section.tsx`

- [ ] **Step 1: LikeButton 컴포넌트 작성**

`like.toggle` mutation + `like.getStatus` query. optimistic update 적용.

- [ ] **Step 2: BookmarkButton 컴포넌트 작성**

`bookmark.toggle` mutation + `bookmark.getStatus` query. optimistic update 적용.

- [ ] **Step 3: CommentSection 컴포넌트 작성**

댓글 목록 (`comment.getByTipId`), 댓글 작성 폼 (로그인 시), 삭제 버튼 (작성자만).

- [ ] **Step 4: 팁 상세 페이지 조합**

마크다운 렌더링 (react-markdown 또는 @next/mdx), 좋아요/북마크 버튼, 댓글 섹션, 수정/삭제 버튼 (작성자만 표시).

- [ ] **Step 5: 마크다운 렌더링 라이브러리 설치**

```bash
npm install react-markdown remark-gfm rehype-highlight
```

- [ ] **Step 6: 커밋**

```bash
git add src/app/tips/\\[id\\]/page.tsx src/components/like-button.tsx src/components/bookmark-button.tsx src/components/comment-section.tsx
git commit -m "feat: implement tip detail page with comments, likes, bookmarks"
```

---

## Task 14: 팁 작성/수정 페이지

**Files:**
- Create: `src/components/tip-form.tsx`
- Create: `src/app/tips/new/page.tsx`
- Create: `src/app/tips/[id]/edit/page.tsx`

- [ ] **Step 1: TipForm 공통 컴포넌트 작성**

제목 입력, 카테고리 선택 (드롭다운), 태그 입력 (콤마 구분 또는 개별 추가), 마크다운 에디터 (textarea + 미리보기 탭). 작성/수정 모드 구분.

- [ ] **Step 2: 팁 작성 페이지 (/tips/new)**

로그인 체크, TipForm으로 `tip.create` mutation 호출. 성공 시 `/tips/[id]`로 리다이렉트.

- [ ] **Step 3: 팁 수정 페이지 (/tips/[id]/edit)**

작성자 체크, 기존 데이터 로드, TipForm으로 `tip.update` mutation 호출.

- [ ] **Step 4: 커밋**

```bash
git add src/components/tip-form.tsx src/app/tips/new/page.tsx src/app/tips/\\[id\\]/edit/page.tsx
git commit -m "feat: implement tip create and edit pages"
```

---

## Task 15: 카테고리별 & 태그별 팁 페이지

**Files:**
- Create: `src/app/category/[slug]/page.tsx`
- Create: `src/app/tag/[name]/page.tsx`

- [ ] **Step 1: 카테고리별 팁 페이지**

`category.getBySlug`로 카테고리 정보, `tip.getAll({ categorySlug })`로 팁 목록. TipCard 그리드 재사용.

- [ ] **Step 2: 태그별 팁 페이지**

`tip.getAll({ tagName })`으로 팁 목록. TipCard 그리드 재사용.

- [ ] **Step 3: 커밋**

```bash
git add src/app/category/\\[slug\\]/page.tsx src/app/tag/\\[name\\]/page.tsx
git commit -m "feat: implement category and tag filter pages"
```

---

## Task 16: 프로젝트 모음 페이지

**Files:**
- Create: `src/components/project-card.tsx`
- Create: `src/components/project-form.tsx`
- Create: `src/app/projects/page.tsx`
- Create: `src/app/projects/new/page.tsx`
- Create: `src/app/projects/[id]/page.tsx`

- [ ] **Step 1: ProjectCard 컴포넌트 작성**

썸네일, 프로젝트명, 설명 미리보기, 태그, 좋아요 수, 작성자. 클릭 시 상세 이동.

- [ ] **Step 2: 프로젝트 목록 페이지**

ProjectCard 그리드, cursor 기반 페이지네이션.

- [ ] **Step 3: ProjectForm 컴포넌트 작성**

제목, 설명, URL, 이미지 URL, 태그 입력.

- [ ] **Step 4: 프로젝트 등록 페이지 (/projects/new)**

로그인 체크, ProjectForm.

- [ ] **Step 5: 프로젝트 상세 페이지 (/projects/[id])**

프로젝트 상세 정보, 좋아요 버튼, 외부 링크 버튼, 수정/삭제 (작성자만).

- [ ] **Step 6: 커밋**

```bash
git add src/components/project-card.tsx src/components/project-form.tsx src/app/projects/
git commit -m "feat: implement project showcase pages"
```

---

## Task 17: 프로필 페이지

**Files:**
- Create: `src/app/profile/page.tsx`

- [ ] **Step 1: 프로필 페이지 구현**

프로필 정보 (아바타, 이름, GitHub 연동 정보), 탭 UI: 내가 작성한 팁 | 북마크한 팁 | 내 프로젝트. 각 탭에서 해당 데이터 fetch. TipCard, ProjectCard 재사용.

- [ ] **Step 2: 커밋**

```bash
git add src/app/profile/page.tsx
git commit -m "feat: implement profile page with tabs"
```

---

## Task 18: 최종 통합 및 검증

- [ ] **Step 1: 전체 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공, 에러 없음

- [ ] **Step 2: 주요 플로우 수동 테스트**

1. GitHub 로그인/로그아웃
2. 팁 작성 → 목록 확인 → 상세 조회
3. 좋아요/북마크 토글
4. 댓글 작성/삭제
5. 검색
6. 카테고리/태그 필터
7. 인기순 정렬
8. 프로젝트 등록/조회
9. 프로필 페이지 각 탭

- [ ] **Step 3: 커밋**

```bash
git add .
git commit -m "chore: final integration and cleanup"
```
