# Fix: 회원가입 syncUser Race Condition

## 배경
회원가입 시 "회원가입 중 오류가 발생했습니다" 에러가 발생하는 문제.
Supabase 로그에서 `GET /auth/v1/admin/users/{uuid}` 요청이 404 (user_not_found)를 반환.

## 근본 원인
`syncUser` tRPC mutation에서 Supabase Admin API로 유저 존재 여부를 검증하는데,
`signUp()` 직후 호출 시 Supabase Auth의 Eventual Consistency로 인해 유저가 아직 조회되지 않는 Race Condition.

**에러 플로우:**
1. 클라이언트: `supabase.auth.signUp()` → 성공 (유저 생성됨)
2. 클라이언트: `syncUser.mutateAsync({ id, email, nickname })` → 서버 호출
3. 서버: `supabaseAdmin.auth.admin.getUserById(id)` → 404 (아직 전파 안됨)
4. 서버: `TRPCError("유효하지 않은 사용자입니다")` throw
5. 클라이언트: catch 블록 → "회원가입 중 오류가 발생했습니다" 표시

## 수정 방안
`syncUser`의 Admin API 검증에 **재시도 로직(retry with delay)** 추가:
- 최대 3회 재시도, 각 500ms 대기
- Supabase signUp이 반환한 user ID는 유효하므로 짧은 지연 후 조회 가능

## 수정 범위
- `src/server/api/routers/auth.ts`: syncUser mutation의 getUserById 호출에 retry 추가

## 영향 파일
- `src/server/api/routers/auth.ts`
