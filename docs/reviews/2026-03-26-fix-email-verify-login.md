# Review: 이메일 인증 후 로그인 불가 수정

## 구현 내용

### 1. httpOnly 쿠키 설정 제거
- `middleware.ts`와 `server.ts`에서 Supabase auth 쿠키의 `httpOnly: true` 제거
- 브라우저 Supabase 클라이언트가 `document.cookie`를 통해 세션을 정상적으로 읽을 수 있도록 수정
- `sameSite: "lax"`, `secure` (production only), `path: "/"` 설정은 유지

### 2. 이메일 콜백 라우트 개선
- 기존 PKCE `code` 파라미터 처리 유지
- `token_hash` + `type` 파라미터 처리 추가 (`verifyOtp` 사용)
- Supabase 설정에 따라 다른 이메일 인증 방식도 지원

## 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/lib/supabase/middleware.ts` | `httpOnly: true` 제거 |
| `src/lib/supabase/server.ts` | `httpOnly: true` 제거 |
| `src/app/auth/callback/route.ts` | `token_hash`/`type` 처리 추가 |

## 주요 결정

- Supabase SSR 공식 패턴에서 auth 쿠키에 `httpOnly`를 설정하지 않음
  - 이유: `@supabase/ssr`의 `createBrowserClient`가 `document.cookie`로 세션을 관리
  - `httpOnly` 설정 시 클라이언트 SDK가 세션 감지 불가

## 검증
- `npm run typecheck` 통과
