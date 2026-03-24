# Email/Password 인증 전환

## 배경

현재 GitHub OAuth만 지원하는 인증 시스템을 Email/Password 기반 인증으로 전환합니다.
이메일 인증(Email Verification)을 포함하여, 사용자가 실제 이메일 소유자인지 확인합니다.

## 요구사항

### 핵심 기능
1. **회원가입**: 이메일 + 비밀번호로 계정 생성
2. **이메일 인증**: 회원가입 후 인증 메일 발송 → 인증 링크 클릭으로 이메일 확인
3. **로그인**: 이메일 + 비밀번호로 로그인 (이메일 인증 완료된 사용자만)
4. **GitHub OAuth 제거**: 기존 GitHub 로그인 제거

### 상세 흐름
- **회원가입 흐름**: 이메일/비밀번호 입력 → DB에 사용자 생성 → 인증 메일 발송 → 인증 링크 클릭 → emailVerified 업데이트
- **로그인 흐름**: 이메일/비밀번호 입력 → Credentials provider로 인증 → emailVerified 체크 → JWT 발급
- **이메일 재발송**: 미인증 사용자가 인증 메일 재발송 요청 가능

## 범위

### In Scope
- NextAuth Credentials provider 설정
- User 모델에 `password` 필드 추가 (bcrypt 해싱)
- 회원가입 tRPC 라우터 (`auth.register`)
- 이메일 인증 토큰 생성/검증 (기존 `VerificationToken` 모델 활용)
- 이메일 발송 (Nodemailer + SMTP)
- 회원가입 페이지 (`/auth/signup`)
- 로그인 페이지 업데이트 (이메일/비밀번호 폼)
- 이메일 인증 페이지 (`/auth/verify-email`)
- 환경변수 추가 (SMTP 설정)

### Out of Scope
- 비밀번호 재설정 (추후 구현)
- 소셜 로그인 (GitHub 등 — 제거)
- 2FA (추후 구현)

## 기술 접근

### 1. Prisma 스키마 변경
```prisma
model User {
  // 기존 필드...
  password      String?  // bcrypt 해싱된 비밀번호 (OAuth 사용자는 null)
}
```

### 2. 패키지 추가
- `bcryptjs`: 비밀번호 해싱
- `nodemailer`: 이메일 발송
- `@types/bcryptjs`, `@types/nodemailer`: 타입 정의

### 3. NextAuth 설정 변경
- GitHub provider 제거
- Credentials provider 추가 (이메일/비밀번호 검증)

### 4. tRPC 라우터
- `auth.register`: 회원가입 (이메일 중복 체크, 비밀번호 해싱, 인증 메일 발송)
- `auth.resendVerification`: 인증 메일 재발송
- `auth.verifyEmail`: 토큰으로 이메일 인증 처리

### 5. 환경변수
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: 메일 서버 설정
- `NEXT_PUBLIC_APP_URL`: 인증 링크 생성용

## 영향받는 파일

| 파일 | 변경 내용 |
|------|----------|
| `prisma/schema.prisma` | User에 password 필드 추가 |
| `src/server/auth/config.ts` | Credentials provider로 전환 |
| `src/env.js` | SMTP 환경변수 추가 |
| `src/app/auth/signin/page.tsx` | 이메일/비밀번호 폼으로 변경 |
| `src/app/auth/signup/page.tsx` | 회원가입 페이지 (신규) |
| `src/app/auth/verify-email/page.tsx` | 이메일 인증 페이지 (신규) |
| `src/server/api/routers/auth.ts` | 인증 관련 tRPC 라우터 (신규) |
| `src/server/api/root.ts` | auth 라우터 등록 |
| `src/lib/email.ts` | 이메일 발송 유틸리티 (신규) |
| `package.json` | bcryptjs, nodemailer 추가 |
