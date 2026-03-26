# Admin 유저 관리 개선 — 리뷰

## 구현 내용

### 1. Supabase Admin 클라이언트 추가
- `src/lib/supabase/server.ts`에 `createAdminClient()` 함수 추가
- `service_role` 키를 사용하여 Supabase Admin API 호출 가능

### 2. `getAllUsers` 백엔드 개선
- 필터 파라미터 추가: `role`, `emailVerified`, `search`
- Prisma 조회 후 Supabase Admin API로 auth 정보(`emailConfirmedAt`, `lastSignInAt`, `createdAt`) 병합
- `emailVerified` 필터는 auth 데이터 기반이므로 merge 후 서버에서 필터링

### 3. 프론트엔드 유저 관리 페이지 개선
- 검색 바 (닉네임/이메일)
- Role 필터 (전체/USER/ADMIN)
- 이메일 인증 필터 (전체/인증완료/미인증)
- 유저 카드에 인증 배지, 가입일, 마지막 로그인 시간 표시

## 변경 파일
- `src/lib/supabase/server.ts` — `createAdminClient` 추가
- `src/server/api/routers/admin.ts` — `getAllUsers` 쿼리 필터 + auth 병합
- `src/app/admin/users/page.tsx` — 필터 UI + 카드 정보 확장
- `docs/requirements/2026-03-26-admin-user-management-enhance.md` — 요구사항
- `docs/reviews/2026-03-26-admin-user-management-enhance.md` — 본 문서

## 알려진 제한사항
- `listUsers`의 `perPage: 1000` 제한: 유저 1000명 초과 시 pagination 필요
- `emailVerified` 필터 적용 시 페이지당 아이템 수가 줄어들 수 있음 (DB 조회 후 필터링이므로)
