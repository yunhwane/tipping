# Review: 새로고침 시 세션 유실 문제 수정

## 구현 내용

### 1. `useAuth` hook race condition 제거 (`src/hooks/use-auth.ts`)
- 기존: `getUser()` (네트워크) + `onAuthStateChange` (쿠키) 동시 실행 → race condition
- 수정: `onAuthStateChange`만 사용하여 `INITIAL_SESSION` 이벤트로 세션 복원
- `getUser()` 네트워크 호출 제거로 초기 렌더링 속도도 개선

### 2. 미들웨어 쿠키 옵션 명시화 (`src/lib/supabase/middleware.ts`)
- `path: "/"` — 모든 경로에서 쿠키 접근 보장
- `sameSite: "lax"` — CSRF 방어 + 외부 링크 접근 허용
- `secure: true` (프로덕션) — HTTPS 전용
- `httpOnly: true` — XSS 방어

### 3. 서버 클라이언트 쿠키 옵션 통일 (`src/lib/supabase/server.ts`)
- 미들웨어와 동일한 쿠키 옵션 적용
- 서버/미들웨어 간 쿠키 설정 일관성 확보

## 변경 파일
- `src/hooks/use-auth.ts` — race condition 제거
- `src/lib/supabase/middleware.ts` — 쿠키 옵션 추가
- `src/lib/supabase/server.ts` — 쿠키 옵션 추가

## 알려진 제한
- node_modules 미설치 상태로 로컬 타입체크 불가 (CI에서 검증 필요)
