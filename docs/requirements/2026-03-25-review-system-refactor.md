# 검수 시스템 리팩토링

## 배경

현재 운영 검수 시스템의 비즈니스 로직이 6개 파일에 걸쳐 중복되어 있고, 사용자 경험 측면에서도 개선이 필요합니다.

### 현재 문제점

1. Tip/Project 검수 로직이 복붙 수준으로 중복 (admin.ts, tip.ts, project.ts)
2. 승인/반려 시 작성자에게 알림 없음
3. 승인된 글 수정 시 무조건 재검수 → 공개 목록에서 사라짐
4. 팁/프로젝트 검수 대기열이 분리되어 관리 비효율
5. 일괄 처리 불가 (건당 승인/반려만 가능)
6. APPROVED 가드가 like/comment/bookmark에 중복

## 요구사항

### R1. 수정 정책 변경

- APPROVED된 콘텐츠는 수정해도 APPROVED 유지
- 검수 감사 필드(reviewedAt, reviewedBy, rejectionReason) 수정 시 초기화하지 않음
- 관리자가 문제 발견 시 직접 REJECTED 처리 (사후 관리)

### R2. 인앱 알림 시스템

- Notification 모델 추가 (userId, type, message, contentType, contentId, read, createdAt)
- 알림 타입: CONTENT_APPROVED, CONTENT_REJECTED
- 검수 처리 시 자동으로 작성자에게 알림 생성
- notification tRPC 라우터: 목록 조회, 읽음 처리, 읽지 않은 수 조회
- 헤더에 알림 벨 아이콘 + 미읽 배지

### R3. 통합 검수 대기열

- getPendingTips + getPendingProjects → getPendingContents(type?) 통합
- reviewTip + reviewProject → reviewContent(type, id, action) 통합
- getAllTips + getAllProjects → getAllContents(type?, status?) 통합
- bulkReview(items, action) 일괄 처리 추가
- 단일 시간순 목록 + 타입 필터(전체/팁/프로젝트) UI

### R4. 헬퍼 함수로 중복 제거

- ensureApproved(db, tipId) — like/comment/bookmark 공통 사용
- reviewContent(db, type, id, action, reviewerId) — 승인/반려 + 알림 생성
- checkContentAccess(content, session) — 비공개 콘텐츠 접근 제어

## 범위

### 포함

- Prisma 스키마 변경 (Notification 모델)
- 백엔드 라우터 리팩토링 (admin, tip, project, like, comment, bookmark)
- 헬퍼 함수 신규 작성
- 알림 라우터 신규 작성
- 관리자 검수 페이지 UI 통합
- 알림 벨 컴포넌트

### 제외

- 이메일 알림
- 신고 기능
- 콘텐츠 이력 관리

## 기술 접근

- 기존 T3 Stack 컨벤션 유지 (tRPC + Prisma + Zod)
- 헬퍼 함수는 `src/server/api/helpers/` 디렉토리에 배치
- admin 라우터의 기존 API 중 Tip/Project 분리 프로시저는 통합 프로시저로 대체

## 영향 파일

| 파일 | 변경 |
|------|------|
| prisma/schema.prisma | Notification 모델 추가 |
| src/server/api/helpers/content-review.ts | 신규 |
| src/server/api/routers/notification.ts | 신규 |
| src/server/api/routers/admin.ts | 리팩토링 |
| src/server/api/routers/tip.ts | 수정 정책 변경, 헬퍼 사용 |
| src/server/api/routers/project.ts | 수정 정책 변경, 헬퍼 사용 |
| src/server/api/routers/like.ts | 헬퍼 사용 |
| src/server/api/routers/comment.ts | 헬퍼 사용 |
| src/server/api/routers/bookmark.ts | 헬퍼 사용 |
| src/server/api/root.ts | notification 라우터 등록 |
| src/app/admin/reviews/page.tsx | 통합 대기열 UI |
| src/components/notification-bell.tsx | 신규 |
