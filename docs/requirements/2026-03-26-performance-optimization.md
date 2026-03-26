# 성능 최적화 종합 개선

## 배경
웹사이트 전반적인 체감 속도가 느린 문제. 진단 결과 리전(도쿄)보다 코드 레벨 병목이 주 원인.

## 요구사항

### 1. Auth 조회 최적화 (체감 효과 최대)
**현재 문제**: `createTRPCContext`에서 매 tRPC 요청마다 `supabase.auth.getUser()` + `db.user.findUnique()` 호출 → 공개 API도 불필요한 DB 왕복 2회
**해결**: publicProcedure는 auth 조회를 lazy하게 처리. 미들웨어에서 이미 가져온 세션 정보를 활용하되, DB user 조회는 protectedProcedure에서만 수행.

- `createTRPCContext`: supabase.auth.getUser()는 호출하되, DB user 조회는 제거
- protectedProcedure 미들웨어에서 DB user를 조회하도록 이동
- Admin 라우터의 `getAllUsers`에서 전체 유저를 가져오는 `listUsers({ perPage: 1000 })` → 개별 유저 조회로 변경

### 2. DB 인덱스 추가
**현재 문제**: Tip 테이블에 인기순 정렬(`status + viewCount`) 복합 인덱스 없음
**해결**: `@@index([status, viewCount])` 추가

### 3. 이미지 최적화
**현재 문제**: `project-showcase-card.tsx`에서 raw `<img>` 사용 → Next.js 이미지 최적화 미적용
**해결**: Next.js `Image` 컴포넌트로 교체 (lazy loading, WebP 변환, 반응형 자동 적용)

### 4. Shiki 하이라이터 lazy loading
**현재 문제**: 코드 블록이 없는 페이지에서도 Shiki 번들(~300KB+) 로드 가능성
**해결**: `next/dynamic`으로 MarkdownContent를 lazy import하고, Shiki 초기화를 더 가볍게 처리

## 범위
- `src/server/api/trpc.ts` — auth 컨텍스트 lazy화
- `src/server/api/routers/admin.ts` — getAllUsers 쿼리 최적화
- `prisma/schema.prisma` — Tip 인덱스 추가
- `src/components/project-showcase-card.tsx` — Image 컴포넌트 적용
- `src/components/markdown-content.tsx` — Shiki lazy loading

## 기술 접근
- tRPC context에서 user를 lazy getter로 변경하여 public endpoint 성능 개선
- Supabase admin API 호출을 개별 유저 조회(`getUserById`)로 변경
- Prisma schema에 복합 인덱스 추가 후 `db:push`
- Next.js Image with `fill` prop + `sizes` 속성 활용
- Shiki를 dynamic import로 코드 스플리팅
