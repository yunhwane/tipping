# Feature: 이메일 인증 메일 재발송 버튼

## 배경
회원가입 후 이메일 인증을 완료하지 않은 상태에서 로그인 시도 시
"이메일 인증이 완료되지 않았습니다" 에러가 표시되지만, 인증 메일을 재발송할 수 있는 방법이 없음.

## 요구사항
- 로그인 페이지에서 `email_not_confirmed` 에러 발생 시 인증 메일 재발송 버튼 표시
- 버튼 클릭 시 Supabase `resend()` API로 인증 메일 재발송
- 발송 성공/실패 피드백 제공

## 기술 접근
- `supabase.auth.resend({ type: 'signup', email })` 사용
- 로그인 페이지에서 `email_not_confirmed` 에러 상태일 때만 재발송 버튼 노출
- 재발송 성공 시 안내 메시지, 실패 시 에러 메시지 표시

## 영향 파일
- `src/app/auth/signin/page.tsx`
