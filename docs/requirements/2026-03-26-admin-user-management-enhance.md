# Admin 유저 관리 개선 — 이메일 인증 표시 + 필터

## 배경

현재 admin 유저 관리 페이지(`/admin/users`)는 기본 정보(닉네임, 이메일, role, 콘텐츠 수)만 표시하며 필터 기능이 없다. 이메일 인증 여부를 확인할 수 없고, 유저가 늘어나면 특정 유저를 찾기 어렵다.

## 요구사항

### 1. 이메일 인증 여부 표시
- Supabase Admin API(`supabase.auth.admin.listUsers`)로 인증 상태 조회
- 각 유저 카드에 인증 완료/미인증 배지 표시
- 가입일, 마지막 로그인 시간 표시

### 2. 필터 기능
- **Role 필터**: 전체 / USER / ADMIN
- **이메일 인증 필터**: 전체 / 인증완료 / 미인증
- **텍스트 검색**: nickname 또는 email로 검색

## 범위

- 백엔드: `admin.getAllUsers` 쿼리 수정 (필터 파라미터 + Supabase Auth 데이터 병합)
- 프론트: `/admin/users` 페이지에 필터 UI + 유저 카드 정보 확장

## 기술 접근

1. `getAllUsers` input에 `role`, `emailVerified`, `search` 필터 추가
2. Prisma에서 User 조회 (role, search 필터 적용)
3. Supabase Admin API로 auth 정보 조회 (`email_confirmed_at`, `last_sign_in_at`, `created_at`)
4. 두 데이터를 user ID로 merge
5. `emailVerified` 필터는 merge 후 서버에서 필터링
6. 프론트에서 필터 상태 관리 → 쿼리 파라미터로 전달

## 영향 파일

- `src/server/api/routers/admin.ts` — `getAllUsers` 쿼리 수정
- `src/app/admin/users/page.tsx` — 필터 UI + 카드 정보 확장
- `src/lib/supabase/server.ts` — Admin API 클라이언트 필요 시 추가
