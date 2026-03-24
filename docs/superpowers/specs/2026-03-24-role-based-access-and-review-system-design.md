# Role-Based Access Control & Content Review System

## Overview

사용자 역할(ADMIN/USER) 기반 접근 제어와 Tip/Project 사전 검수 시스템을 구현한다.
콘텐츠는 생성 시 PENDING 상태로 시작하며, ADMIN이 승인해야 공개된다.

## 1. DB Schema Changes

### New Enums

```prisma
enum Role {
  USER
  ADMIN
}

enum ContentStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Model Changes

**User** — `role` 필드 추가:

```prisma
model User {
  // ... existing fields
  role  Role  @default(USER)
}
```

**Tip** — `status`, `rejectionReason`, audit 필드 추가:

```prisma
model Tip {
  // ... existing fields
  status           ContentStatus @default(PENDING)
  rejectionReason  String?
  reviewedAt       DateTime?
  reviewedBy       String?       // Admin user ID

  @@index([status, createdAt])
}
```

**Project** — `status`, `rejectionReason`, audit 필드 추가:

```prisma
model Project {
  // ... existing fields
  status           ContentStatus @default(PENDING)
  rejectionReason  String?
  reviewedAt       DateTime?
  reviewedBy       String?       // Admin user ID

  @@index([status, createdAt])
}
```

### Migration Strategy

- 기존 Tip/Project 데이터는 migration 시 `APPROVED`로 설정 (이미 공개된 콘텐츠)
- 기존 User는 `USER` role로 설정
- **초기 Admin 부트스트랩**: Prisma seed 스크립트 또는 DB 직접 업데이트로 첫 번째 ADMIN 지정

### DB Index

- `Tip`, `Project` 모두 `@@index([status, createdAt])` 추가 — status 필터 + 정렬 성능

## 2. Authentication & Authorization

### NextAuth Session Strategy Change

현재 NextAuth 5 + PrismaAdapter는 기본 `database` 세션 전략을 사용한다. Middleware(Edge Runtime)에서 role 체크를 하려면 DB 조회가 불가능하므로 **JWT 전략으로 변경**한다.

**변경 사항:**
- `authConfig`에 `session: { strategy: "jwt" }` 추가
- `jwt` 콜백: DB에서 user.role을 조회하여 토큰에 포함 (`token.role = user.role`)
- `session` 콜백: 시그니처가 `({ session, user })` → `({ session, token })`으로 변경, `token.role`과 `token.sub`(user.id)를 세션에 주입
- 기존 module augmentation의 주석 처리된 role 활성화 (Prisma `Role` 타입 import)

**JWT 전환 영향:**
- `Session` DB 테이블은 더 이상 사용되지 않음 (PrismaAdapter가 Account/User 관리에만 사용)
- 서버 사이드 세션 즉시 무효화(revocation) 불가 — role 변경 시 다음 토큰 갱신까지 지연 가능
- 기존 세션 데이터는 자동으로 JWT로 전환됨 (기존 사용자 재로그인 필요)

### tRPC Procedure Hierarchy

```
publicProcedure     — 인증 불필요 (기존)
protectedProcedure  — 로그인 필수 (기존)
adminProcedure      — 로그인 + role === ADMIN 필수 (신규)
```

- `adminProcedure`는 `protectedProcedure`를 확장, role 체크 미들웨어 추가
- role이 ADMIN이 아니면 `TRPCError("FORBIDDEN")` 반환

### Next.js Middleware — Admin Route Protection

- `src/middleware.ts` 신규 생성
- NextAuth 5의 `auth()` wrapper를 middleware로 사용
- JWT 토큰에 role이 포함되어 있으므로 DB 조회 없이 Edge에서 체크 가능
- `/admin/*` 경로 접근 시:
  1. 세션 확인 → 없으면 `/auth/signin` 리다이렉트
  2. role 확인 → ADMIN 아니면 `/` (홈)으로 리다이렉트
- matcher: `/admin/:path*`만 대상

### Existing Query Changes

공개 쿼리에 `status: APPROVED` 필터 추가 대상:
- `tip.getAll` — 목록 조회
- `tip.getPopular` — 인기 팁
- `tip.search` — 검색
- `project.getAll` — 프로젝트 목록 (현재 프로젝트에는 search 엔드포인트 없음 — getAll이 유일한 공개 목록 조회)
- 카테고리/태그 기반 필터 쿼리

**`getById` 접근 규칙** (session-aware):
- 비로그인 / 일반 유저: `APPROVED` 콘텐츠만 접근 가능
- 작성자 본인: 모든 status 접근 가능 (본인 콘텐츠)
- ADMIN: 모든 status 접근 가능

**인터랙션 제한** (`APPROVED` 콘텐츠에만 허용):
- `like.toggle` — 좋아요
- `bookmark.toggle` — 북마크
- `comment.create` — 댓글 작성
- `project.toggleLike` — 프로젝트 좋아요

작성자 본인 조회(프로필 "내 글")에서는 모든 status 표시 + 상태 뱃지

## 3. Admin Pages

### Route Structure

```
/admin                 — 대시보드 (통계 개요)
/admin/reviews         — 검수 리스트 (PENDING 콘텐츠)
/admin/tips            — 전체 Tip 관리
/admin/projects        — 전체 Project 관리
/admin/users           — 유저 관리 (role 변경)
```

### Dashboard (`/admin`)

- 전체 유저 수, Tip 수, Project 수
- 검수 대기(PENDING) 건수 — Tip / Project 각각
- 최근 가입 유저, 최근 생성 콘텐츠 간략 목록

### Review List (`/admin/reviews`)

- PENDING 상태의 Tip/Project 탭으로 구분
- 각 항목: 제목, 작성자, 생성일, 미리보기
- 액션: 승인 / 거절 (거절 시 사유 입력 모달)
- 승인 → `status: APPROVED`, `reviewedAt: now()`, `reviewedBy: admin.id`
- 거절 → `status: REJECTED` + `rejectionReason` 저장 + `reviewedAt`, `reviewedBy`

### Tip/Project Management (`/admin/tips`, `/admin/projects`)

- 모든 상태의 콘텐츠 목록 (상태별 필터, 커서 기반 페이지네이션)
- 액션: 삭제, 상태 변경
  - **Tip 삭제 시 cascade**: comments, likes, bookmarks 함께 삭제 (DB `onDelete: Cascade`)
  - **Project 삭제 시 cascade**: projectLikes 삭제, tag 연결(many-to-many)은 자동 해제
- Comment 관리는 해당 Tip 상세에서 삭제 가능

### User Management (`/admin/users`)

- 전체 유저 목록 (이름, 이메일, role, 가입일, 커서 기반 페이지네이션)
- 액션: role 변경 (USER ↔ ADMIN)
- 본인의 role은 변경 불가 (안전장치)

### tRPC Admin Router

```
admin.router
  ├── getDashboardStats      — 통계 조회
  ├── getPendingTips         — PENDING Tip 목록 (커서 페이지네이션)
  ├── getPendingProjects     — PENDING Project 목록 (커서 페이지네이션)
  ├── reviewTip              — Tip 승인/거절
  ├── reviewProject          — Project 승인/거절
  ├── getAllTips             — 전체 Tip (상태 필터 + 커서 페이지네이션)
  ├── getAllProjects         — 전체 Project (상태 필터 + 커서 페이지네이션)
  ├── deleteTip             — Tip 삭제 (cascade)
  ├── deleteProject         — Project 삭제 (cascade)
  ├── deleteComment         — Comment 삭제
  ├── getAllUsers            — 유저 목록 (커서 페이지네이션)
  └── updateUserRole        — role 변경
```

모든 프로시저는 `adminProcedure` 사용.

## 4. Author Experience (Review Flow)

### Tip/Project Creation

- 기존과 동일한 폼으로 작성
- 생성 후 안내 메시지: "관리자 검수 후 공개됩니다"
- 생성 즉시 `status: PENDING`

### Profile "My Content" Tab

- 모든 status의 본인 콘텐츠 표시
- 상태 뱃지:
  - `PENDING` — "검수 대기" (노란색)
  - `APPROVED` — "공개" (초록색)
  - `REJECTED` — "반려" (빨간색)
- REJECTED인 경우 거절 사유 표시 + "수정 후 재요청" 버튼

### Re-submission Flow

```
REJECTED 상태 콘텐츠
  → 작성자가 수정 (기존 edit 페이지)
  → 저장 시 status를 PENDING으로 자동 전환
  → rejectionReason 초기화 (null)
  → reviewedAt, reviewedBy 초기화 (null)
  → 다시 admin 검수 리스트에 표시
```

### Editing APPROVED Content

```
APPROVED 상태 콘텐츠를 수정하면:
  → status를 PENDING으로 전환 (재검수 필요)
  → 공개 목록에서 제거됨
  → admin 검수 리스트에 다시 표시
```

### Bookmarks with Status Changes

- 유저가 북마크한 Tip이 이후 REJECTED/PENDING으로 변경될 경우:
  - `bookmark.getMyBookmarks`에서 `APPROVED` 상태만 반환 (커서 기반 페이지네이션 적용)
  - 비공개 콘텐츠의 북마크는 자동 필터 (삭제하지 않음 — 재승인 시 복원)

### Public List Behavior

- `tip.getAll`, `tip.getPopular`, `tip.search`, `project.getAll` 등 공개 쿼리는 `APPROVED`만 반환
- 검색, 카테고리, 태그 필터 모두 동일하게 `APPROVED` 필터 적용
- 좋아요/북마크/댓글은 `APPROVED` 콘텐츠에만 가능

## 5. Affected Files Summary

### New Files

- `src/middleware.ts` — Next.js middleware (admin route protection)
- `src/server/api/routers/admin.ts` — Admin tRPC router
- `src/app/admin/page.tsx` — Dashboard
- `src/app/admin/reviews/page.tsx` — Review list
- `src/app/admin/tips/page.tsx` — Tip management
- `src/app/admin/projects/page.tsx` — Project management
- `src/app/admin/users/page.tsx` — User management
- `src/app/admin/layout.tsx` — Admin layout (sidebar navigation)

### Modified Files

- `prisma/schema.prisma` — Add enums, add fields to User/Tip/Project, add indexes
- `src/server/auth/config.ts` — JWT/session callback에 role 주입, authorized 콜백, module augmentation
- `src/server/api/trpc.ts` — adminProcedure 추가
- `src/server/api/root.ts` — admin router 등록
- `src/server/api/routers/tip.ts` — status 필터 (getAll, getPopular, search, getById), 수정 시 status 리셋
- `src/server/api/routers/project.ts` — status 필터 (getAll, getById), toggleLike APPROVED 체크, 수정 시 status 리셋
- `src/server/api/routers/like.ts` — APPROVED 체크
- `src/server/api/routers/bookmark.ts` — APPROVED 체크, getMyBookmarks 필터
- `src/server/api/routers/comment.ts` — APPROVED 체크
- `src/app/tips/[id]/page.tsx` — getById 접근 제어 (비공개 콘텐츠 처리)
- `src/app/projects/[id]/page.tsx` — getById 접근 제어 (비공개 콘텐츠 처리)
- `src/app/profile/page.tsx` — 상태 뱃지, 거절 사유 표시
- `src/components/header.tsx` — Admin 링크 (ADMIN role일 때)
- `src/components/tip-card.tsx` — 상태 뱃지 (프로필에서)
- `src/components/project-card.tsx` — 상태 뱃지 (프로필에서)
- `src/components/tip-form.tsx` — 생성 후 검수 안내 메시지, 수정 시 재검수 안내
- `src/components/project-form.tsx` — 생성 후 검수 안내 메시지, 수정 시 재검수 안내
