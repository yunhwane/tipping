# Disquiet 스타일 마이페이지 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로필 페이지를 Disquiet 스타일로 리뉴얼 — 풍부한 프로필 카드(bio, 소셜 링크, 활동 통계), 프로젝트 쇼케이스 카드, 설정 페이지 분리

**Architecture:** User 모델에 `bio`(String?)와 `links`(Json?) 필드를 추가하고, 프로필 헤더를 통계 카드로 리뉴얼하며, 설정을 `/profile/settings`로 분리한다. 프로젝트 탭은 이미지 중심 쇼케이스 카드로 교체한다.

**Tech Stack:** Next.js 15 App Router, tRPC 11, Prisma 6 (PostgreSQL), Tailwind CSS v4, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-25-disquiet-style-profile-design.md`

---

## File Structure

### 수정할 파일
| 파일 | 책임 |
|------|------|
| `prisma/schema.prisma` | User 모델에 `bio`, `links` 필드 추가 |
| `src/server/api/routers/user.ts` | getProfile 확장, getProfileStats 추가, updateProfile 확장 |
| `src/app/profile/page.tsx` | 프로필 헤더 카드 리뉴얼, 탭 구조 변경 |
| `src/components/profile-settings.tsx` | bio 입력, 소셜 링크 편집 UI 추가 |

### 신규 파일
| 파일 | 책임 |
|------|------|
| `src/app/profile/settings/page.tsx` | 설정 페이지 (ProfileSettings 렌더 + 인증 가드) |
| `src/components/project-showcase-card.tsx` | 프로필 전용 프로젝트 쇼케이스 카드 |

---

## Task 1: DB Schema — User 모델에 bio, links 추가

**Files:**
- Modify: `prisma/schema.prisma:63-79` (User 모델)

- [ ] **Step 1: User 모델에 bio, links 필드 추가**

`prisma/schema.prisma`의 User 모델에 두 필드를 추가:

```prisma
model User {
    id            String        @id @default(cuid())
    name          String?
    email         String?       @unique
    emailVerified DateTime?
    password      String?
    image         String?
    bio           String?
    links         Json?
    role          Role          @default(USER)
    accounts      Account[]
    sessions      Session[]
    tips          Tip[]
    comments      Comment[]
    likes         Like[]
    bookmarks     Bookmark[]
    projects      Project[]
    projectLikes  ProjectLike[]
}
```

- [ ] **Step 2: Prisma 클라이언트 재생성**

Run: `npx prisma db push`
Expected: 스키마가 DB에 반영되고 클라이언트가 재생성됨

- [ ] **Step 3: 커밋**

```bash
git add prisma/schema.prisma
git commit -m "feat: User 모델에 bio, links 필드 추가"
```

---

## Task 2: tRPC — getProfile 확장 및 getProfileStats 추가

**Files:**
- Modify: `src/server/api/routers/user.ts`

- [ ] **Step 1: getProfile에 bio, links 반환 추가**

`src/server/api/routers/user.ts`의 `getProfile` 쿼리 select에 추가:

```typescript
getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        links: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" });
    }

    return user;
  }),
```

- [ ] **Step 2: getProfileStats 프로시저 추가**

같은 파일에 `getProfileStats` 추가:

```typescript
getProfileStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

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
```

- [ ] **Step 3: updateProfile에 bio, links 입력 추가**

`updateProfile` mutation을 리팩터링:

```typescript
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
        where: { id: ctx.session.user.id },
        data,
        select: { id: true, name: true, email: true, image: true, bio: true, links: true },
      });

      return user;
    }),
```

- [ ] **Step 4: 타입 체크**

Run: `npm run typecheck`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/server/api/routers/user.ts
git commit -m "feat: getProfile에 bio/links 추가, getProfileStats 신규, updateProfile 확장"
```

---

## Task 3: 프로필 헤더 카드 리뉴얼 + 탭 구조 변경

**Files:**
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: 프로필 페이지 전체 재작성**

`src/app/profile/page.tsx`를 아래와 같이 재작성. 주요 변경:
- 프로필 헤더 카드: 큰 아바타 + 이름 + bio + 소셜 링크 pill + 활동 통계 3종 + 설정 버튼
- 탭: 내 팁 / 내 프로젝트 / 북마크 (설정 탭 제거)
- `handleProfileUpdate` 콜백 제거 (dead code)
- `activeTab` 기본값 "tips" 유지, "settings" 관련 로직 삭제

```tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { TipCard } from "~/components/tip-card";
import { ProjectShowcaseCard } from "~/components/project-showcase-card";
import {
  Settings,
  FileText,
  FolderOpen,
  Bookmark,
  Heart,
  ExternalLink,
} from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { data: profile } = api.user.getProfile.useQuery(undefined, {
    enabled: !!session,
  });
  const { data: stats } = api.user.getProfileStats.useQuery(undefined, {
    enabled: !!session,
  });

  if (status === "loading") return null;
  if (!session) redirect("/api/auth/signin");

  const displayName = profile?.name ?? session.user.name;
  const displayImage = profile?.image ?? session.user.image;
  const bio = profile?.bio as string | null;
  const links = (profile?.links ?? []) as { label: string; url: string }[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Profile Header Card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 ring-2 ring-foreground/5 ring-offset-2 ring-offset-background">
              <AvatarImage
                src={displayImage ?? ""}
                alt={displayName ?? ""}
              />
              <AvatarFallback className="bg-amber-100 text-2xl text-amber-700">
                {displayName?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {bio && (
                <p className="text-sm text-muted-foreground">{bio}</p>
              )}
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Link href="/profile/settings">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-4">
          <div className="flex flex-1 flex-col items-center rounded-lg border border-border/60 bg-muted/20 py-3">
            <span className="text-lg font-bold">
              {stats?.tipCount ?? "--"}
            </span>
            <span className="text-xs text-muted-foreground">팁</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-lg border border-border/60 bg-muted/20 py-3">
            <span className="text-lg font-bold">
              {stats?.projectCount ?? "--"}
            </span>
            <span className="text-xs text-muted-foreground">프로젝트</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-lg border border-border/60 bg-muted/20 py-3">
            <span className="text-lg font-bold">
              {stats?.totalLikes ?? "--"}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" />
              좋아요
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tips">
        <TabsList>
          <TabsTrigger value="tips" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            내 팁
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            내 프로젝트
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            북마크
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tips" className="mt-4">
          <MyTips />
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <MyProjects />
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-4">
          <MyBookmarks />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MyTips() {
  const { data, fetchNextPage, hasNextPage } =
    api.tip.getMyTips.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const tips = data?.pages.flatMap((page) => page.items) ?? [];

  if (!tips.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        작성한 팁이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip) => (
          <TipCard key={tip.id} tip={tip} showStatus />
        ))}
      </div>
      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchNextPage()}
        >
          더 보기
        </Button>
      )}
    </div>
  );
}

function MyProjects() {
  const { data, fetchNextPage, hasNextPage } =
    api.project.getMyProjects.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const projects = data?.pages.flatMap((page) => page.items) ?? [];

  if (!projects.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        등록한 프로젝트가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectShowcaseCard key={project.id} project={project} showStatus />
        ))}
      </div>
      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchNextPage()}
        >
          더 보기
        </Button>
      )}
    </div>
  );
}

function MyBookmarks() {
  const { data, fetchNextPage, hasNextPage } =
    api.bookmark.getMyBookmarks.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const bookmarks = data?.pages.flatMap((page) => page.items) ?? [];

  if (!bookmarks.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        북마크한 팁이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bookmarks.map((bookmark) => (
          <TipCard key={bookmark.tip.id} tip={bookmark.tip} />
        ))}
      </div>
      {hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchNextPage()}
        >
          더 보기
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 커밋 (Task 4 완료 후)**

Task 4 완료 후 함께 커밋. (`ProjectShowcaseCard`가 아직 없으므로 타입 체크는 Task 4에서 수행)

---

## Task 4: 프로젝트 쇼케이스 카드 컴포넌트

**Files:**
- Create: `src/components/project-showcase-card.tsx`

- [ ] **Step 1: 쇼케이스 카드 컴포넌트 작성**

기존 `ProjectCard`의 props 인터페이스를 참고하되 별도 컴포넌트로 작성:

```tsx
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { TagBadge } from "./tag-badge";
import { Heart, Eye, ExternalLink } from "lucide-react";

interface ProjectShowcaseCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    url: string | null;
    imageUrl: string | null;
    viewCount: number;
    createdAt: Date;
    status?: string;
    rejectionReason?: string | null;
    author: { id: string; name: string | null; image: string | null };
    tags: { id: string; name: string }[];
    _count: { likes: number };
  };
  showStatus?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "검수 대기", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "공개", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "반려", className: "bg-red-100 text-red-800" },
};

export function ProjectShowcaseCard({
  project,
  showStatus = false,
}: ProjectShowcaseCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Image Area */}
      <Link href={`/projects/${project.id}`}>
        <div className="aspect-video overflow-hidden">
          {project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
              <span className="px-4 text-center text-sm font-medium text-amber-700/60">
                {project.title}
              </span>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="space-y-3 p-4">
        {/* Title + Status */}
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="flex-1 text-base font-semibold hover:underline line-clamp-1"
          >
            {project.title}
          </Link>
          {showStatus && project.status && statusConfig[project.status] && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[project.status]!.className}`}
            >
              {statusConfig[project.status]!.label}
            </span>
          )}
        </div>

        {/* Rejection Reason */}
        {showStatus &&
          project.status === "REJECTED" &&
          project.rejectionReason && (
            <p className="text-xs text-red-600">
              사유: {project.rejectionReason}
            </p>
          )}

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>

        {/* Tags + Stats */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} name={tag.name} size="sm" />
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> {project._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {project.viewCount}
            </span>
          </div>
        </div>

        {/* Service Link */}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
            서비스 바로가기
          </a>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `npm run typecheck`
Expected: 에러 없음

- [ ] **Step 3: Task 3과 함께 커밋**

```bash
git add src/app/profile/page.tsx src/components/project-showcase-card.tsx
git commit -m "feat: 프로필 헤더 카드 리뉴얼 및 프로젝트 쇼케이스 카드 추가"
```

---

## Task 5: 설정 페이지 분리 — ProfileSettings 확장

**Files:**
- Modify: `src/components/profile-settings.tsx`
- Create: `src/app/profile/settings/page.tsx`

- [ ] **Step 1: ProfileSettings에 bio + 소셜 링크 편집 UI 추가**

`src/components/profile-settings.tsx`에 다음을 추가:

1. `bio` state 추가 + textarea 렌더
2. `links` state 추가 + 동적 추가/삭제 리스트 렌더
3. `handleProfileSave`에서 bio, links 포함하여 전송
4. 초기화 로직(`useEffect`)에 bio, links 반영

주요 변경 부분:

**State 추가** (기존 state 아래):
```tsx
const [bio, setBio] = useState("");
const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
```

**useEffect 초기화 수정:**
```tsx
useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setBio((profile.bio as string) ?? "");
      setLinks(
        Array.isArray(profile.links)
          ? (profile.links as { label: string; url: string }[])
          : [],
      );
      if (profile.image) {
        const matchingSeed = AVATAR_SEEDS.find(
          (seed) => getAvatarUrl(seed) === profile.image,
        );
        if (matchingSeed) {
          setSelectedAvatar(profile.image);
        }
      }
    }
  }, [profile]);
```

**handleProfileSave 수정:**
```tsx
const handleProfileSave = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      setProfileMessage({
        type: "error",
        text: "닉네임은 2~20자여야 합니다",
      });
      return;
    }

    updateProfile.mutate({
      name: trimmedName,
      ...(selectedAvatar ? { image: selectedAvatar } : {}),
      bio: bio,
      links: links.filter((l) => l.label.trim() && l.url.trim()),
    });
  };
```

**hasProfileChanges 수정:**
```tsx
const hasProfileChanges =
    name.trim() !== (profile?.name ?? "") ||
    (selectedAvatar !== null && selectedAvatar !== profile?.image) ||
    bio !== ((profile?.bio as string) ?? "") ||
    JSON.stringify(links) !==
      JSON.stringify(
        Array.isArray(profile?.links) ? profile.links : [],
      );
```

**Bio textarea UI** (닉네임 블록의 닫는 `</div>` 바로 아래, `{/* Profile Message */}` 블록 바로 위에 삽입 — 기존 파일 기준 line 350 이후):
```tsx
{/* Bio */}
<div className="space-y-3">
  <label htmlFor="bio" className="text-sm font-medium">
    한줄 소개
  </label>
  <textarea
    id="bio"
    value={bio}
    onChange={(e) => setBio(e.target.value)}
    placeholder="나를 한 줄로 소개해주세요"
    maxLength={100}
    rows={2}
    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  />
  <div className="flex justify-end">
    <p
      className={cn(
        "text-xs transition-colors",
        bio.length > 90
          ? "text-amber-500"
          : "text-muted-foreground",
      )}
    >
      {bio.length}/100
    </p>
  </div>
</div>
```

**소셜 링크 편집 UI** (Bio 아래, Separator 위에 삽입):
```tsx
{/* Social Links */}
<div className="space-y-3">
  <label className="text-sm font-medium">소셜 링크</label>
  <div className="space-y-2">
    {links.map((link, index) => (
      <div key={index} className="flex items-center gap-2">
        <Input
          value={link.label}
          onChange={(e) => {
            const newLinks = [...links];
            newLinks[index] = { ...link, label: e.target.value };
            setLinks(newLinks);
          }}
          placeholder="라벨 (예: 블로그)"
          maxLength={20}
          className="w-28 shrink-0"
        />
        <Input
          value={link.url}
          onChange={(e) => {
            const newLinks = [...links];
            newLinks[index] = { ...link, url: e.target.value };
            setLinks(newLinks);
          }}
          placeholder="https://..."
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setLinks(links.filter((_, i) => i !== index))}
          className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ))}
  </div>
  {links.length < 5 && (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setLinks([...links, { label: "", url: "" }])}
      className="gap-1.5"
    >
      <Plus className="h-3.5 w-3.5" />
      링크 추가
    </Button>
  )}
  {links.length > 0 && (
    <p className="text-xs text-muted-foreground">
      최대 5개까지 추가할 수 있습니다 ({links.length}/5)
    </p>
  )}
</div>
```

**Import 추가** (기존 import에):
```tsx
import { Trash2, Plus } from "lucide-react";
```

- [ ] **Step 2: 설정 페이지 생성**

`src/app/profile/settings/page.tsx`:

```tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileSettings } from "~/components/profile-settings";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (!session) redirect("/api/auth/signin");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">설정</h1>
      </div>

      <ProfileSettings />
    </div>
  );
}
```

- [ ] **Step 3: ProfileSettings에서 onProfileUpdate prop을 optional로 유지**

기존 코드에서 `onProfileUpdate`를 받고 있으므로, prop은 유지하되 새 설정 페이지에서는 전달하지 않음. 이미 optional(`onProfileUpdate?: () => void`)이므로 변경 불필요.

- [ ] **Step 4: 타입 체크**

Run: `npm run typecheck`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/profile-settings.tsx src/app/profile/settings/page.tsx
git commit -m "feat: 설정 페이지 분리 및 bio/소셜 링크 편집 UI 추가"
```

---

## Task 6: 빌드 검증 및 최종 커밋

**Files:** 없음 (전체 빌드 검증)

- [ ] **Step 1: 타입 체크**

Run: `npm run typecheck`
Expected: 에러 없음

- [ ] **Step 2: 빌드**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 빌드 에러가 있으면 수정 후 커밋**

에러가 있으면 수정하고:
```bash
git add <수정한 파일들>
git commit -m "fix: 빌드 에러 수정"
```
