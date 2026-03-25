# Review: Supabase 이메일 인증 리다이렉트 버그 수정

## 구현 내용

Supabase 회원가입 이메일 인증 링크가 `localhost`로 리다이렉트되는 버그를 수정했습니다.

## 주요 변경사항

### 1. `src/app/auth/signup/page.tsx`
- `supabase.auth.signUp()` 호출 시 `emailRedirectTo: ${NEXT_PUBLIC_APP_URL}/auth/callback` 옵션 추가
- `env` import 추가

### 2. `src/env.ts`
- `NEXT_PUBLIC_APP_URL`을 `optional()`에서 `required`로 변경 — 인증 리다이렉트에 필수이므로

## 결정 사항

- Supabase 대시보드의 Site URL 변경 대신 코드 레벨에서 `emailRedirectTo`를 명시적으로 지정하는 방식 선택 — 환경별(dev/staging/prod) URL을 환경변수로 제어 가능

## 변경 파일

- `src/app/auth/signup/page.tsx`
- `src/env.ts`
- `docs/requirements/2026-03-25-fix-supabase-confirm-redirect.md`
- `docs/reviews/2026-03-25-fix-supabase-confirm-redirect.md`

## 알려진 제한사항

- Supabase 대시보드의 "Redirect URLs" 허용 목록에 프로덕션 URL이 등록되어 있어야 함
- `NEXT_PUBLIC_APP_URL` 환경변수가 Vercel 등 배포 환경에 설정되어 있어야 함

## 관련 이슈

- https://github.com/yunhwane/tipping/issues/10
