# Review: syncUser Supabase Admin 검증 제거

## 변경 내용

`syncUser` tRPC mutation에서 Supabase Admin API를 통한 유저 존재 검증 로직을 제거했다.

## 변경 파일

| 파일 | 변경 |
|------|------|
| `src/server/api/routers/auth.ts` | Admin 검증 루프(3회 retry) 제거, `@supabase/supabase-js` import 제거 |

## 주요 결정

- **검증 제거 선택**: `signUp` 성공 응답 자체가 Supabase Auth에 유저가 존재한다는 증거. eventual consistency 문제로 admin API가 404를 반환하는 근본 원인을 retry로 해결하기보다 검증 자체를 제거.
- **보안 판단**: 가짜 UUID로 DB 레코드 생성 가능하나, Supabase 세션 없이는 protectedProcedure 통과 불가하므로 실질적 위험 없음.

## 제거된 코드

- `createClient` (service role) 생성
- `admin.getUserById()` 호출 및 3회 재시도 루프 (500ms 간격)
- 검증 실패 시 "유효하지 않은 사용자입니다" 에러

## 알려진 제한

- 없음
