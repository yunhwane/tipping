# 성능 최적화 종합 개선 — Review

## 구현 내용

### 1. Auth 조회 lazy화
- `createTRPCContext`에서 DB user 조회를 즉시 수행하지 않고, `getUser()` lazy getter로 변경
- publicProcedure는 DB user 조회를 완전히 건너뜀 → 요청당 1회 DB 왕복 제거
- protectedProcedure는 `getUser()`를 호출하여 필요할 때만 DB 조회
- `tip.getById`, `project.getById` (publicProcedure)는 `checkContentAccess`에서 `await ctx.getUser()` 사용
- 캐싱: 같은 요청 내 `getUser()` 다중 호출 시 한 번만 DB 조회

### 2. Admin getAllUsers 쿼리 최적화
- `listUsers({ perPage: 1000 })` (전체 유저 로드) → `getUserById()` (페이지 내 유저만 개별 조회)로 변경
- `Promise.allSettled`로 병렬 실행하여 속도 유지

### 3. Tip 테이블 복합 인덱스 추가
- `@@index([status, viewCount])` 추가
- 인기순 정렬 쿼리(`status: APPROVED, orderBy: viewCount desc`)에 활용

### 4. 이미지 최적화
- `project-showcase-card.tsx`: raw `<img>` → Next.js `Image` with `fill` + `sizes`
- 부모 div에 `relative` 추가하여 `fill` 레이아웃 지원
- 자동 lazy loading, WebP 변환, 반응형 이미지 최적화 적용

### 5. Shiki lazy loading
- `createHighlighter` 직접 import → `import("shiki")` dynamic import로 변경
- 코드 블록이 없는 콘텐츠에서는 Shiki를 아예 로드하지 않음 (`HAS_CODE_BLOCK` regex 체크)

## 변경 파일
- `src/server/api/trpc.ts` — auth context lazy화
- `src/server/api/routers/admin.ts` — getAllUsers 쿼리 최적화
- `src/server/api/routers/tip.ts` — getUser() 호출 변경
- `src/server/api/routers/project.ts` — getUser() 호출 변경
- `prisma/schema.prisma` — Tip 복합 인덱스 추가
- `src/components/project-showcase-card.tsx` — Image 컴포넌트 적용
- `src/components/markdown-content.tsx` — Shiki dynamic import + 조건부 로드

## 알려진 제한사항
- Prisma 인덱스는 `db:push` 또는 마이그레이션 실행 후 적용됨
- Admin `getUserById` 개별 호출은 유저 수가 매우 많은 페이지(50명)에서는 50번의 API 호출이 발생할 수 있으나, 1000명 전체를 가져오는 것보다 효율적
