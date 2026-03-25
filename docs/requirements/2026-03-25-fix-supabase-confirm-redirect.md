# Fix: Supabase 이메일 인증 리다이렉트 버그

## 배경

회원가입 후 Supabase가 발송하는 이메일 인증 링크가 프로덕션 URL이 아닌 `localhost:3000`으로 리다이렉트됨. `supabase.auth.signUp()` 호출 시 `emailRedirectTo` 옵션이 누락되어 Supabase 대시보드의 기본 Site URL이 사용되는 것이 원인.

## 요구사항

1. `signUp()` 호출 시 `emailRedirectTo`를 `NEXT_PUBLIC_APP_URL/auth/callback`으로 명시
2. `NEXT_PUBLIC_APP_URL` 환경변수를 필수(`required`)로 변경

## 수정 대상 파일

- `src/app/auth/signup/page.tsx` — `emailRedirectTo` 옵션 추가
- `src/env.ts` — `NEXT_PUBLIC_APP_URL`을 필수로 변경

## 범위

- 이메일 인증 리다이렉트 URL 수정만 포함
- Supabase 대시보드 설정 변경 불필요 (코드 레벨에서 해결)

## 관련 이슈

- https://github.com/yunhwane/tipping/issues/10
