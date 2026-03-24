# 프로필 설정 기능 리뷰

**작성일**: 2026-03-24
**브랜치**: `feat/profile-settings`

## 구현 내용

### 1. 백엔드 - user tRPC 라우터
- `getProfile`: 현재 사용자 프로필 조회 (id, name, email, image)
- `updateProfile`: 닉네임(2~20자, trim) 및 아바타 URL 변경
- `changePassword`: 현재 비밀번호 bcrypt 검증 후 새 비밀번호 해싱 저장

### 2. 프론트엔드 - ProfileSettings 컴포넌트
- DiceBear API 기반 Mock 아바타 12종 그리드 선택
- 닉네임 입력 필드 (기존 값 프리필, 실시간 글자수 경고)
- 비밀번호 변경 폼 (현재/새/확인 3단계)
- 성공/에러 메시지 인라인 표시

### 2-1. UI/UX 개선 사항
- **비밀번호 강도 표시기**: 3단계 프로그레스 바 (weak/medium/strong) + 조건별 체크리스트
- **비밀번호 show/hide 토글**: 각 비밀번호 입력 필드에 Eye/EyeOff 아이콘 토글
- **비밀번호 확인 실시간 매칭**: 입력 시 일치/불일치 즉시 피드백
- **비밀번호 변경 버튼 스마트 활성화**: 모든 조건(현재 비밀번호 입력, 강도 strong, 확인 일치) 충족 시만 활성화
- **카드 비주얼 강화**: border + shadow + hover:shadow-md 트랜지션
- **아바타 hover 애니메이션**: 미선택 아바타에 scale-110 호버 효과
- **에러 아이콘 추가**: 에러 메시지에 CircleAlert 아이콘으로 가시성 향상
- **KeyRound 아이콘 뱃지**: 비밀번호 섹션 헤더에 아이콘 배지 추가

### 3. 프로필 페이지 탭 추가
- "설정" 탭을 기존 탭(내 팁, 북마크, 내 프로젝트) 옆에 추가

## 주요 결정사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 아바타 | DiceBear Mock | 파일 업로드 없이 즉시 사용 가능, URL 기반이라 향후 전환 용이 |
| 비밀번호 검증 | 기존 회원가입 규칙 동일 적용 | 8자+, 영문+숫자, bcrypt 12라운드 |
| 세션 업데이트 | `updateSession()` 호출 | 닉네임/이미지 변경 즉시 반영 |
| 클라이언트 검증 | 서버 검증과 동일 | UX 향상 (불필요한 API 호출 방지) |

## 변경된 파일

| 파일 | 변경 |
|------|------|
| `src/server/api/routers/user.ts` | **신규** - user 라우터 |
| `src/server/api/root.ts` | user 라우터 등록 추가 |
| `src/components/profile-settings.tsx` | **신규** - 설정 탭 UI |
| `src/app/profile/page.tsx` | 설정 탭 추가 |
| `docs/requirements/2026-03-24-profile-settings.md` | 요구사항 문서 |

## 알려진 제한사항

- 프로필 사진은 Mock (DiceBear 아바타 선택만 가능)
- 이메일 변경 미지원 (별도 작업 필요)
- 계정 삭제 미지원
