# Review: 504 타임아웃 및 카테고리 개수 불일치 수정

## 구현 내용

### 1. Supabase Auth lazy 호출 (504 수정)
- `createTRPCContext`에서 `supabase.auth.getUser()`를 eager → lazy로 변경
- `getSupabaseUser()` lazy getter 도입: 실제로 인증이 필요한 `protectedProcedure`에서만 호출
- `publicProcedure`는 Supabase Auth API 호출 없이 즉시 응답 가능
- context에서 `supabaseUser` 프로퍼티 제거 (외부에서 직접 참조하는 곳 없음 확인)

### 2. 카테고리 팁 개수 APPROVED 필터 추가
- `getAll`, `getTopCategories` 쿼리의 `_count`에 `where: { status: "APPROVED" }` 조건 추가
- PENDING/REJECTED 상태의 팁이 카운트에서 제외됨

## 주요 결정
- `supabaseUser`를 context에서 완전히 제거하고 `getUser()` 내부에서만 참조하도록 캡슐화
- 두 lazy getter 모두 캐싱 적용 (동일 요청 내 중복 호출 방지)

## 변경 파일
- `src/server/api/trpc.ts` — context 생성에서 auth lazy 호출
- `src/server/api/routers/category.ts` — 카테고리 개수 APPROVED 필터
- `docs/requirements/2026-03-26-fix-504-category-count.md` — 요구사항 문서
- `docs/reviews/2026-03-26-fix-504-category-count.md` — 리뷰 문서

## 알려진 제한사항
- Supabase Auth 자체가 완전히 다운되면 `protectedProcedure`는 여전히 영향받음 (이는 의도된 동작)
