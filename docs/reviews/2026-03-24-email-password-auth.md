# Review: Email/Password 인증 전환

## 구현 내용

GitHub OAuth 인증을 Email/Password 기반 인증으로 전환하고, 이메일 인증(verification) 플로우를 구현했습니다.

## 주요 변경사항

### 1. Prisma 스키마
- `User` 모델에 `password` (String?, bcrypt 해시) 필드 추가

### 2. NextAuth 설정 (`src/server/auth/config.ts`)
- `GitHubProvider` → `CredentialsProvider`로 전환
- `authorize()`에서 이메일/비밀번호 검증 + emailVerified 체크
- 미인증 이메일 시 `EMAIL_NOT_VERIFIED` 에러 throw

### 3. tRPC 라우터 (`src/server/api/routers/auth.ts`)
- `auth.register`: 회원가입 (이메일 중복 체크, bcrypt 해싱, 인증 메일 발송)
- `auth.verifyEmail`: 토큰으로 이메일 인증 처리
- `auth.resendVerification`: 인증 메일 재발송

### 4. 이메일 발송 (`src/lib/email.ts`)
- Nodemailer SMTP transporter
- HTML 템플릿 인증 메일 발송

### 5. 페이지
- `/auth/signin` — 이메일/비밀번호 로그인 폼 (GitHub OAuth 버튼 제거)
- `/auth/signup` — 회원가입 폼 (이름, 이메일, 비밀번호, 비밀번호 확인)
- `/auth/verify-email` — 토큰 기반 이메일 인증 처리

### 6. 환경변수 (`src/env.js`)
- GitHub OAuth 관련 변수 제거
- SMTP 설정 추가: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `NEXT_PUBLIC_APP_URL` 추가

## 변경된 파일

| 파일 | 상태 |
|------|------|
| `prisma/schema.prisma` | 수정 |
| `generated/prisma/*` | 자동 생성 |
| `src/server/auth/config.ts` | 수정 |
| `src/server/api/root.ts` | 수정 |
| `src/server/api/routers/auth.ts` | 신규 |
| `src/lib/email.ts` | 신규 |
| `src/env.js` | 수정 |
| `src/app/auth/signin/page.tsx` | 수정 |
| `src/app/auth/signup/page.tsx` | 신규 |
| `src/app/auth/verify-email/page.tsx` | 신규 |
| `package.json` | 수정 |
| `package-lock.json` | 수정 |

## 주요 결정사항

1. **bcryptjs 선택**: Native bcrypt 대신 순수 JS 구현체 사용 — Edge Runtime 호환
2. **nodemailer@6.x**: next-auth 5.0.0-beta.25의 peerDependency 호환
3. **기존 VerificationToken 모델 활용**: NextAuth adapter 표준 모델 재사용
4. **SMTP 환경변수 optional**: 개발 환경에서 메일 서버 없이도 앱 기동 가능

## 알려진 제한사항

- 비밀번호 재설정 기능 미구현 (추후 대응)
- 2FA 미지원
- 기존 GitHub OAuth 사용자의 마이그레이션 미포함 (password가 null인 상태)
