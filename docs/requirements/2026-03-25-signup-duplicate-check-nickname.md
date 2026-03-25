# 회원가입 중복체크 & name → nickname 변경

## 배경
현재 회원가입 시 이메일/닉네임 중복체크가 프론트엔드에서 이루어지지 않고, User 모델의 `name` 필드를 `nickname`으로 변경하여 용도를 명확히 해야 함.

## 요구사항

### 1. 이메일 중복체크
- 회원가입 폼에서 이메일 입력 후 중복 여부를 서버에서 확인
- tRPC에 `auth.checkEmail` 프로시저 추가
- 중복 시 사용자에게 명확한 에러 메시지 표시

### 2. 닉네임 중복체크
- Prisma User 모델의 `name` → `nickname` 필드명 변경
- `nickname`에 `@unique` 제약 추가
- tRPC에 `auth.checkNickname` 프로시저 추가
- 회원가입 폼에서 닉네임 중복 확인

### 3. UI 변경
- 회원가입 폼 label: "이름" → "닉네임"
- placeholder 변경
- 중복체크 결과를 인라인으로 표시 (실시간 또는 blur 시)

## 기술 접근

### Prisma 스키마 변경
```prisma
model User {
    id       String  @id
    nickname String  @unique   // name → nickname, unique 추가
    email    String  @unique
    ...
}
```

### tRPC 프로시저 추가 (auth router)
- `auth.checkEmail`: 이메일 존재 여부 확인 (publicProcedure)
- `auth.checkNickname`: 닉네임 존재 여부 확인 (publicProcedure)

### 영향받는 파일
- `prisma/schema.prisma` — User 모델 `name` → `nickname`
- `src/server/api/routers/auth.ts` — syncUser, checkEmail, checkNickname
- `src/server/api/routers/user.ts` — getProfile, updateProfile
- `src/app/auth/signup/page.tsx` — 폼 UI + 중복체크 로직
- `src/hooks/use-auth.ts` — name 참조 변경
- 기타 `name` 참조하는 컴포넌트들

## 범위
- 회원가입 플로우 개선에 한정
- 기존 데이터 마이그레이션은 `prisma db push`로 처리 (개발 단계)
