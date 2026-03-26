# Fix: 새로고침 시 세션 유실 문제

## 배경
브라우저 새로고침 시 로그인 상태가 불규칙적으로 풀리는 증상 발생. 로그인 직후에도 간헐적으로 발생하며, 시간 경과와 무관하게 불규칙적.

## 원인 분석

### 1. `useAuth` hook race condition
- `getUser()` (네트워크 요청)와 `onAuthStateChange` (쿠키 기반)가 동시에 실행
- `getUser()`가 먼저 완료되어 null 반환 시 → 로그아웃 상태로 렌더링
- 이후 `onAuthStateChange`의 `INITIAL_SESSION`이 세션을 복원하지만 이미 UI는 로그아웃 상태

### 2. 쿠키 옵션 미지정
- Supabase SSR 클라이언트(server, middleware)에 명시적 쿠키 옵션 없음
- 기본값에 의존 → 환경에 따라 쿠키가 유실될 수 있음

## 수정 범위

| 파일 | 변경 내용 |
|------|-----------|
| `src/hooks/use-auth.ts` | 중복 `getUser()` 제거, `onAuthStateChange`만 사용 |
| `src/lib/supabase/middleware.ts` | 명시적 쿠키 옵션 추가 |
| `src/lib/supabase/server.ts` | 명시적 쿠키 옵션 추가 |

## 기술적 접근
1. `useAuth`에서 `getUser()` 직접 호출 제거 → `onAuthStateChange`의 `INITIAL_SESSION` 이벤트에 의존
2. 미들웨어/서버 Supabase 클라이언트에 `cookieOptions` 설정 (`path: "/"`, `sameSite: "lax"`, `secure` 등)
