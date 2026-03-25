# Review: 이메일 인증 메일 재발송 버튼

## 구현 내용
로그인 페이지에서 이메일 미인증 에러 발생 시 인증 메일 재발송 버튼 추가.

## 핵심 변경
- `emailNotConfirmed` 상태로 미인증 에러 추적, 해당 상태일 때만 재발송 버튼 노출
- `supabase.auth.resend({ type: "signup", email })` 호출로 인증 메일 재발송
- 재발송 성공 시 녹색 안내 메시지, 실패 시 에러 메시지 표시
- 로딩 상태(`resending`) 관리로 중복 클릭 방지

## 변경 파일
- `src/app/auth/signin/page.tsx`: 재발송 핸들러, 상태, UI 추가
