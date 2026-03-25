# 검수 시스템 리팩토링 리뷰

## 구현 내용

### 1. 수정 정책 변경
- APPROVED 콘텐츠 수정 시 APPROVED 상태 유지 (기존: 무조건 PENDING)
- REJECTED 콘텐츠 수정 시에만 PENDING으로 재제출
- 관리자가 문제 발견 시 직접 REJECTED 처리하는 사후 관리 방식

### 2. 인앱 알림 시스템
- `Notification` 모델 추가 (userId, type, message, contentType, contentId, read)
- 검수 처리 시 작성자에게 자동 알림 생성 (승인/반려)
- `notification` tRPC 라우터: 목록 조회, 읽음 처리, 읽지 않은 수 조회
- 헤더에 알림 벨 컴포넌트 추가 (30초 폴링, Popover UI)

### 3. 통합 검수 대기열
- `getPendingTips` + `getPendingProjects` → `getPendingContents(type?)` 통합
- `reviewTip` + `reviewProject` → `reviewContent(type, id, action)` 통합
- `getAllTips` + `getAllProjects` → `getAllContents(type?, status?)` 통합
- `bulkReview` 일괄 승인/반려 추가
- 검수 대기 페이지: 단일 시간순 목록 + 타입 필터 + 체크박스 선택 + 일괄 처리

### 4. 헬퍼 함수로 중복 제거
- `ensureApprovedTip()`: like/comment/bookmark 3곳에서 공통 사용
- `checkContentAccess()`: tip/project getById 2곳에서 공통 사용
- `reviewContent()`: 검수 처리 + 알림 생성을 트랜잭션으로 묶음

## 주요 결정

- **수정 시 APPROVED 유지**: 작성자 경험 우선. 악의적 수정은 사후 관리로 대응.
- **알림은 인앱만**: 이메일 인프라 없이 빠르게 구현. 추후 이메일 확장 가능.
- **통합 대기열 JS 병합**: Prisma가 다른 모델 간 UNION을 지원하지 않아, 각각 쿼리 후 JS에서 시간순 정렬.

## 변경 파일

| 파일 | 변경 |
|------|------|
| prisma/schema.prisma | Notification 모델 추가, User에 관계 추가 |
| src/server/api/helpers/content-review.ts | 신규 — 공통 헬퍼 3개 |
| src/server/api/routers/notification.ts | 신규 — 알림 CRUD |
| src/server/api/routers/admin.ts | 통합 프로시저로 전면 리팩토링 |
| src/server/api/routers/tip.ts | 수정 정책 변경, 헬퍼 사용 |
| src/server/api/routers/project.ts | 수정 정책 변경, 헬퍼 사용 |
| src/server/api/routers/like.ts | ensureApprovedTip 헬퍼 사용 |
| src/server/api/routers/comment.ts | ensureApprovedTip 헬퍼 사용 |
| src/server/api/routers/bookmark.ts | ensureApprovedTip 헬퍼 사용 |
| src/server/api/root.ts | notification 라우터 등록 |
| src/app/admin/reviews/page.tsx | 통합 대기열 UI |
| src/app/admin/tips/page.tsx | 통합 API 사용 |
| src/app/admin/projects/page.tsx | 통합 API 사용 |
| src/components/notification-bell.tsx | 신규 — 알림 벨 |
| src/components/header.tsx | 알림 벨 추가 |

## 알려진 제한사항

- 알림 실시간성: WebSocket 대신 30초 폴링 (소규모 서비스에 적합)
- 프로젝트 좋아요 APPROVED 가드는 project 라우터에 인라인으로 유지 (별도 모델이라 Tip 헬퍼와 통합 불가)
- DB 마이그레이션은 `prisma db push`로 수행 필요 (DATABASE_URL 설정 후)
