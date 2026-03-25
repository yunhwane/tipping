# syncUser Supabase Admin 검증 제거

## 배경

회원가입 시 `syncUser` tRPC mutation이 Supabase Admin API(`admin.getUserById`)로 유저 존재 여부를 검증한다.
Supabase Auth의 eventual consistency로 인해 `signUp` 직후 admin API가 404를 반환하는 문제가 반복 발생.
기존 재시도 로직(3회 × 500ms)으로도 해결되지 않는 케이스가 확인됨.

## 요구사항

- `syncUser` mutation에서 Supabase Admin API 검증 로직 전체 제거
- `signUp` 성공 응답의 user ID를 신뢰하고 바로 DB 레코드 생성
- `supabase-js` createClient(service role) import도 불필요 시 제거

## 범위

- 변경 파일: `src/server/api/routers/auth.ts`
- 변경 없음: 클라이언트 signup 페이지, Prisma 스키마, 환경변수

## 기술적 접근

1. `auth.ts`의 `syncUser` mutation에서 Supabase Admin 클라이언트 생성 및 검증 루프(line 54-76) 제거
2. 파일 상단의 `@supabase/supabase-js` import가 다른 곳에서 미사용이면 제거
3. 기존 로직(중복 체크, DB 생성)은 그대로 유지

## 보안 고려

- 조작된 UUID로 DB 레코드 생성 가능하나, Supabase 세션 없이는 `protectedProcedure` 통과 불가
- 실질적 보안 위험 없음
