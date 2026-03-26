# 리뷰: 자동 닉네임 생성 및 기본 아바타 배정

## 구현 내용

### 1. 닉네임 자동생성 (`src/lib/nickname-generator.ts`)
- 한글 형용사(15개) + 동물(15개) + 2자리 숫자 조합으로 자동 생성
- `isUnique` 콜백을 주입받아 중복 확인 (최대 5회 재시도)
- fallback: UUID 4자리 suffix 사용

### 2. syncUser 변경 (`src/server/api/routers/auth.ts`)
- `nickname` 파라미터 제거 → 서버에서 자동 생성
- 8개 기본 DiceBear 아바타 중 랜덤 배정하여 `image` 필드에 저장
- `TRPCError` import 제거 (더 이상 닉네임 중복 에러를 throw하지 않음)

### 3. 회원가입 페이지 간소화 (`src/app/auth/signup/page.tsx`)
- 닉네임 입력 필드 및 실시간 중복 검사 UI 제거
- `checkNickname` 쿼리 제거
- Supabase signUp의 `data.nickname` 메타데이터 제거
- `syncUser` 호출에서 nickname 파라미터 제거

### 4. 프로필 설정 아바타 조정 (`src/components/profile-settings.tsx`)
- 아바타 seed 12개 → 8개로 축소 (Felix, Aneka, Milo, Sasha, Luna, Orion, Pepper, Zoe)
- 그리드 레이아웃 6열 → 4열로 변경

## 변경 파일
- `src/lib/nickname-generator.ts` (신규)
- `src/server/api/routers/auth.ts` (수정)
- `src/app/auth/signup/page.tsx` (수정)
- `src/components/profile-settings.tsx` (수정)
- `docs/requirements/2026-03-26-auto-nickname-avatar.md` (신규)

## 알려진 제한사항
- 닉네임 조합 총 22,500개 (형용사15 × 동물15 × 숫자100). 대규모 사용자 시 확장 필요.
- `checkNickname` API는 프로필 설정에서 닉네임 변경 시 여전히 사용 가능하도록 유지.
