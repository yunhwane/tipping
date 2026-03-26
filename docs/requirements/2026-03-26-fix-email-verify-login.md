# fix: 이메일 인증 후 로그인 불가 및 프로필 접근 불가 수정

## 배경

회원가입 후 이메일 인증 링크를 클릭하면 자동 로그인이 되어야 하지만 로그인 페이지로 리다이렉트되는 문제와,
이메일 인증 후 수동 로그인해도 내 프로필 페이지에 접근하면 다시 로그인 페이지로 가는 문제가 발생.

## 원인 분석

Supabase 인증 쿠키에 `httpOnly: true`가 설정되어 있어 브라우저 Supabase 클라이언트(`createBrowserClient`)가
`document.cookie`를 통해 세션 쿠키를 읽지 못함.

- **middleware.ts**: 모든 요청마다 쿠키를 `httpOnly`로 덮어씌움
- **server.ts**: Route Handler에서 쿠키 설정 시 `httpOnly` 적용

이로 인해:
1. 이메일 콜백에서 세션 교환 후 쿠키가 httpOnly로 설정 → 브라우저 클라이언트가 세션 감지 불가
2. 로그인 후 `router.refresh()` 시 미들웨어가 쿠키를 httpOnly로 덮어씌움 → 세션 유실

## 수정 범위

### 변경 파일
- `src/lib/supabase/middleware.ts` — `httpOnly: true` 제거
- `src/lib/supabase/server.ts` — `httpOnly: true` 제거
- `src/app/auth/callback/route.ts` — `token_hash` + `type` 파라미터 처리 추가

### 변경하지 않는 파일
- 클라이언트 코드 (`use-auth.ts`, 페이지 컴포넌트 등)

## 기술적 접근

1. Supabase SSR 공식 가이드에 따라 auth 쿠키에서 `httpOnly` 제거
2. 이메일 인증 콜백에서 PKCE(`code`) 외에 `token_hash` + `type` 방식도 처리하여 호환성 강화
