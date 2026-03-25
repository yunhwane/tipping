# 리뷰: 회원가입 중복체크 & name → nickname 변경

## 구현 내용

### 1. Prisma 스키마 변경
- `User.name` (nullable) → `User.nickname` (required, `@unique`)
- 닉네임 중복 방지를 DB 레벨에서 보장

### 2. tRPC auth 라우터 — 중복체크 프로시저 추가
- `auth.checkEmail` — 이메일 중복 확인 (publicProcedure, query)
- `auth.checkNickname` — 닉네임 중복 확인 (publicProcedure, query)
- `auth.syncUser` — `name` → `nickname` 변경 + 서버 사이드 닉네임 중복 체크 추가

### 3. 회원가입 UI 개선
- `useDebounce` 훅으로 500ms 디바운싱 후 실시간 중복체크
- 닉네임/이메일 필드에 체크/X 아이콘 인라인 피드백
- 중복 시 에러 메시지 표시 + 가입 버튼 비활성화
- 라벨: "이름" → "닉네임", placeholder 변경

### 4. 전체 `name` → `nickname` 리네이밍
모든 tRPC 라우터, 컴포넌트, 타입에서 User의 `name` 필드를 `nickname`으로 변경

## 변경된 파일
- `prisma/schema.prisma` — User 모델
- `prisma/seed.ts` — 시드 데이터
- `src/server/api/trpc.ts` — 컨텍스트 타입
- `src/server/api/routers/auth.ts` — syncUser + checkEmail/checkNickname
- `src/server/api/routers/user.ts` — getProfile, updateProfile
- `src/server/api/routers/tip.ts` — author select
- `src/server/api/routers/project.ts` — author select
- `src/server/api/routers/comment.ts` — author select
- `src/server/api/routers/bookmark.ts` — author select
- `src/server/api/routers/admin.ts` — 모든 select
- `src/hooks/use-auth.ts` — AuthUser 인터페이스
- `src/app/auth/signup/page.tsx` — 회원가입 폼 전체 재작성
- `src/components/header.tsx` — session.nickname
- `src/components/tip-card.tsx` — author.nickname
- `src/components/project-card.tsx` — author.nickname
- `src/components/project-showcase-card.tsx` — author.nickname
- `src/components/comment-section.tsx` — author.nickname
- `src/components/profile-settings.tsx` — profile.nickname
- `src/app/profile/page.tsx` — displayName
- `src/app/admin/page.tsx` — user.nickname
- `src/app/admin/reviews/page.tsx` — item.author.nickname
- `src/app/admin/users/page.tsx` — user.nickname
- `src/app/admin/tips/page.tsx` — author.nickname
- `src/app/admin/projects/page.tsx` — author.nickname
- `src/app/tips/[id]/page.tsx` — author.nickname
- `src/app/projects/[id]/page.tsx` — author.nickname

## 주요 결정
- 닉네임을 required + unique로 변경 (기존 name은 nullable이었음)
- 중복체크는 2중 방어: 프론트 실시간 체크 + syncUser 서버 사이드 체크 + DB unique 제약
- 디바운싱 500ms로 API 호출 최적화

## 알려진 제한
- 기존 DB 데이터에 `name`이 NULL인 유저가 있으면 마이그레이션 시 에러 발생 가능 → `prisma db push`로 처리 필요
- 닉네임 변경 시(프로필 설정) 중복체크는 아직 미적용 (기존과 동일)
