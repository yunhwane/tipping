# Review: 회원가입 syncUser Race Condition 수정

## 구현 내용
`syncUser` mutation의 Supabase Admin API 유저 검증에 재시도 로직 추가.

## 핵심 변경
- `supabaseAdmin.auth.admin.getUserById()` 호출을 최대 3회 재시도 (500ms 간격)
- 보안 검증(Admin API 유저 확인) 로직은 그대로 유지
- 마지막 시도 실패 시 기존과 동일하게 `TRPCError` throw

## 변경 파일
- `src/server/api/routers/auth.ts`: syncUser mutation 내 getUserById retry 추가

## 알려진 제한사항
- Supabase Auth의 전파 지연이 1초 이상인 극단적 경우 여전히 실패 가능 (매우 드묾)
