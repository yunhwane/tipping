# Supabase + Vercel Migration Design

## Background

현재 T3 Stack 앱(Next.js 15 + tRPC 11 + Prisma 6 + NextAuth 5)을 Supabase + Vercel 기반으로 전환한다. tRPC와 Prisma는 유지하면서 Auth, Storage, DB 호스팅, 배포만 교체한다.

## Scope

| 영역 | 현재 | 변경 후 |
|------|------|---------|
| DB 호스팅 | 로컬 PostgreSQL | Supabase PostgreSQL (connection pooling) |
| Auth | NextAuth 5 + Credentials + bcryptjs | Supabase Auth |
| Storage | 없음 | Supabase Storage (avatars, tips, projects) |
| 이메일 | Nodemailer (SMTP) | Supabase Auth 내장 이메일 |
| 배포 | 없음 | Vercel (서버리스) |
| ORM | Prisma 6 | Prisma 6 (유지) |
| API | tRPC 11 | tRPC 11 (유지) |

## Out of Scope

- Supabase Realtime
- Supabase Edge Functions
- tRPC → Supabase Client SDK 전환
- 기존 유저 데이터 마이그레이션 (데이터 없음)
- 소셜 로그인 (나중에 추가 가능)

---

## 1. Prisma 스키마 변경

### 제거할 모델

- `Account` — Supabase Auth 내부 관리
- `Session` — Supabase JWT 기반
- `VerificationToken` — Supabase 이메일 인증 대체

### User 모델 변경

```prisma
model User {
  id    String @id                    // Supabase Auth UUID 그대로 사용 (cuid 기본값 제거)
  name  String?
  email String  @unique               // Supabase Auth에서 동기화 (비정규화, 이메일 조회용 유지)
  bio   String?
  image String?
  links Json?
  role  Role   @default(USER)

  // 관계 유지
  tips          Tip[]
  comments      Comment[]
  likes         Like[]
  bookmarks     Bookmark[]
  projects      Project[]
  projectLikes  ProjectLike[]
  notifications Notification[]
}
```

**제거 필드:**
- `emailVerified` — Supabase Auth가 관리
- `password` — Supabase Auth가 관리
- `accounts Account[]` — Account 모델 제거에 따라 삭제
- `sessions Session[]` — Session 모델 제거에 따라 삭제

**유지 필드:**
- `email` — Prisma 쿼리에서 이메일 조회가 필요하므로 비정규화하여 유지. 회원가입 시 Supabase Auth의 email과 동기화.

**참고:** 현재 User 모델에 `createdAt`/`updatedAt`이 없으므로 추가하지 않음. generator client 블록(`output = "../generated/prisma"`)은 변경 없음.

- 나머지 도메인 모델(Tip, Project, Comment 등)은 변경 없음

### datasource 변경

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // Supabase connection pooling (포트 6543)
  directUrl = env("DIRECT_URL")         // Supabase 직접 연결 (마이그레이션용)
}
```

---

## 2. Auth 통합

### 패키지 변경

**설치:** `@supabase/supabase-js`, `@supabase/ssr`

**제거:** `next-auth`, `@auth/prisma-adapter`, `bcryptjs`, `@types/bcryptjs`, `nodemailer`, `@types/nodemailer`

### Supabase 클라이언트 유틸

- `src/lib/supabase/server.ts` — 서버 컴포넌트/API용 (쿠키 기반)
- `src/lib/supabase/client.ts` — 클라이언트 컴포넌트용
- `src/lib/supabase/middleware.ts` — Next.js 미들웨어용 (토큰 갱신)

### tRPC Context 변경

```
현재: NextAuth getServerSession() → session.user { id, name, email, image, role }
변경: Supabase getUser() → user.id → Prisma User findUnique → { id, name, email, image, role }
```

- `createTRPCContext`: Supabase 서버 클라이언트에서 `getUser()` 호출 → Prisma User 조회하여 context에 세팅
- context 타입: `{ db: PrismaClient, user: { id, name, email, image, role } | null, supabase: SupabaseClient }`
- `protectedProcedure`: `ctx.user` 존재 확인 (없으면 `UNAUTHORIZED`)
- `adminProcedure`: `ctx.user.role === ADMIN` 확인

**import 변경 필요:**
- `src/server/api/trpc.ts`: `import { auth } from "~/server/auth"` 제거 → Supabase 클라이언트 사용
- `src/middleware.ts`: NextAuth `auth()` 래퍼 제거 → Supabase 미들웨어 패턴으로 교체

### Auth 라우터 변경

| 현재 | 변경 |
|------|------|
| `register` (bcrypt + Prisma) | Supabase `auth.signUp()` + Prisma User 생성 |
| `verifyEmail` | 제거 (Supabase 처리) |
| `resendVerification` | 제거 (Supabase `resend()`) |

로그인/로그아웃은 클라이언트에서 Supabase SDK 직접 호출.

### Next.js 미들웨어

현재 미들웨어는 NextAuth `auth()` 래퍼를 사용 (`export default auth((req) => { ... })` + `req.auth`). 이를 완전히 교체:

```typescript
// 새 패턴: src/middleware.ts
// 1. createServerClient로 Supabase 클라이언트 생성 (쿠키에서 세션 읽기)
// 2. supabase.auth.getUser()로 인증 확인
// 3. /admin 경로: 인증 + DB role 체크 (또는 Supabase user_metadata 활용)
// 4. updateSession()으로 토큰 자동 갱신
```

- `src/lib/supabase/middleware.ts`에 `updateSession()` 유틸 작성
- `src/middleware.ts`에서 호출

### User 동기화

- 회원가입: Supabase Auth 생성 → 동일 UUID로 Prisma User `create`
- 로그인: Supabase `user.id`로 Prisma User `findUnique`

---

## 3. Storage 통합

### 버킷 구성

| 버킷 | 용도 | 접근 |
|------|------|------|
| `avatars` | 프로필 이미지 | public 읽기, 인증 유저 쓰기 |
| `tips` | 팁 콘텐츠 이미지 | public 읽기, 인증 유저 쓰기 |
| `projects` | 프로젝트 이미지 | public 읽기, 인증 유저 쓰기 |

### 업로드 흐름

1. 클라이언트에서 Supabase Storage에 직접 업로드
2. 파일 경로: `{bucket}/{userId}/{timestamp}-{filename}`
3. 업로드 후 public URL 획득
4. tRPC를 통해 URL을 DB에 저장

### Storage 정책 (RLS)

- **읽기**: 모든 유저 (public 버킷)
- **쓰기**: 인증된 유저만 (`auth.uid()` 기반)
- **삭제**: 파일 소유자만 (`{userId}/` 경로 매칭)

### tRPC 라우터 수정

- 이미지 업로드 유틸리티 함수 (`src/lib/supabase/storage.ts`)
- 기존 `image` 필드가 있는 모델은 URL 저장 방식 그대로 유지

---

## 4. Vercel 배포

### 설정

- `vercel.json` 불필요 (Next.js 자동 감지)
- 빌드: `prisma generate && next build` (postinstall로 커버)

### 환경 변수 (Vercel Dashboard)

| 변수 | 용도 |
|------|------|
| `DATABASE_URL` | Supabase PostgreSQL connection pooling (`?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | Supabase 직접 연결 (마이그레이션용) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 사이드 admin 작업 |
| `NEXT_PUBLIC_APP_URL` | Vercel 배포 도메인 |

### 제거할 환경 변수

- `AUTH_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

### env.ts 스키마 변경

```typescript
// src/env.ts — 변경 후
server: {
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
},
client: {
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
},
```

### CI 업데이트

- GitHub Actions 유지 (typecheck + build)
- Vercel GitHub 연동으로 PR 프리뷰 배포 자동화

---

## 5. 제거 대상 파일/패키지

### 파일 제거

- `src/server/auth/` — NextAuth 설정 전체 (`config.ts`, `index.ts`)
- `src/lib/email.ts` — Nodemailer 이메일 유틸
- `src/app/api/auth/[...nextauth]/` — NextAuth API 라우트

### 클라이언트 페이지 재작성

- `src/app/auth/signin/page.tsx` — NextAuth `signIn()` → Supabase `auth.signInWithPassword()`
- `src/app/auth/signup/page.tsx` — NextAuth 기반 → Supabase `auth.signUp()` + Prisma User 생성
- 이메일 인증 페이지 — Supabase가 처리하므로 기존 인증 페이지 제거 또는 Supabase 콜백 처리 페이지로 교체
- `src/app/auth/callback/route.ts` — Supabase Auth 콜백 핸들러 (새로 생성)

### 패키지 제거

- `next-auth`, `@auth/prisma-adapter`
- `bcryptjs`, `@types/bcryptjs`
- `nodemailer`, `@types/nodemailer`

---

## 6. 커밋 전략

하나의 브랜치, 5단계 커밋, PR 1개:

| # | 커밋 | 내용 |
|---|------|------|
| 1 | `chore: supabase 패키지 설치 및 환경 설정` | 패키지 설치/제거, env.ts 변경 |
| 2 | `refactor: prisma 스키마 supabase auth 대응` | 모델 제거/변경, datasource 수정 (directUrl 포함) |
| 3 | `refactor: supabase auth로 인증 전환` | Supabase 클라이언트, tRPC context, 미들웨어, auth 라우터, 로그인/회원가입 페이지 |
| 4 | `feat: supabase storage 이미지 업로드 추가` | Storage 유틸, 업로드 컴포넌트, 라우터 수정 |
| 5 | `chore: vercel 배포 설정 및 CI 업데이트` | .env.example, CI 환경 변수 업데이트 |

---

## Risks & Mitigations

| 리스크 | 대응 |
|--------|------|
| Supabase Free Tier 7일 비활성 정지 | 주기적 접속 또는 cron ping |
| Storage 1GB 한도 초과 | 이미지 리사이즈 + Pro 업그레이드 준비 |
| Vercel 서버리스 cold start | Prisma connection pooling으로 완화 |
| Supabase Auth ↔ Prisma User 동기화 실패 | 트랜잭션 처리, 에러 시 Auth user 삭제 |
