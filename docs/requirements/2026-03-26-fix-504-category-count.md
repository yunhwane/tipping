# fix: 504 타임아웃 및 카테고리 개수 불일치 수정

## 배경

1. **504 Gateway Timeout**: 모든 라우트(`/`, `/tips`, `/category/*`, `/api/trpc/*`)에서 25초 타임아웃 발생
2. **카테고리 개수 불일치**: 카테고리 뱃지의 팁 개수가 실제 공개된 팁 수와 다름

## 근본 원인 분석

### 504 타임아웃
- `src/server/api/trpc.ts:12`에서 `await supabase.auth.getUser()`를 context 생성 시 **eagerly** 호출
- `publicProcedure`(인증 불필요)에서도 매번 Supabase Auth API를 호출
- Supabase Auth 서비스가 Unhealthy/느릴 때 모든 요청이 블로킹됨

### 카테고리 개수 불일치
- `src/server/api/routers/category.ts:32`에서 `_count: { select: { tips: true } }`가 모든 상태의 팁을 카운트
- PENDING, REJECTED 상태의 팁도 포함되어 실제 사용자에게 보이는 수와 다름

## 수정 방안

### 1. `supabase.auth.getUser()` lazy 호출로 변경
- `createTRPCContext`에서 `supabaseUser`를 즉시 조회하지 않고 lazy getter로 변경
- `protectedProcedure`에서만 실제로 호출되도록 변경
- publicProcedure는 Supabase Auth 호출 없이 즉시 응답 가능

### 2. 카테고리 팁 개수에 APPROVED 필터 추가
- `getAll`, `getTopCategories` 쿼리의 `_count`에 `where: { status: "APPROVED" }` 조건 추가

## 영향 범위

- `src/server/api/trpc.ts` — context 생성 로직
- `src/server/api/routers/category.ts` — 카테고리 쿼리
