# DB Index 최적화

## 배경

현재 스키마에 일부 인덱스가 설정되어 있으나, 실제 쿼리 패턴을 분석한 결과 누락된 인덱스가 다수 발견됨. 데이터가 증가할수록 성능 저하가 심화될 수 있는 구간이 확인됨.

## 현재 상태 (기존 인덱스)

| 모델 | 기존 인덱스 |
|------|------------|
| Tip | authorId, categoryId, createdAt, [status+createdAt] |
| Comment | tipId |
| Like | PK(userId, tipId) |
| Bookmark | PK(userId, tipId) |
| Project | authorId, createdAt, [status+createdAt] |
| ProjectLike | PK(userId, projectId) |
| Notification | [userId+read], [userId+createdAt] |

## 문제 분석 및 추가할 인덱스

### 1. Like.tipId (높은 우선순위)
- **쿼리**: `like.count({ where: { tipId } })` — 팁 상세에서 좋아요 수 조회
- **문제**: PK가 `(userId, tipId)` 순서라 tipId 단독 필터 시 index scan 불가
- **해결**: `@@index([tipId])` 추가

### 2. ProjectLike.projectId (높은 우선순위)
- **쿼리**: `projectLike` count, `_count: { select: { likes } }` — 프로젝트 목록/상세
- **문제**: PK가 `(userId, projectId)` 순서라 동일 문제
- **해결**: `@@index([projectId])` 추가

### 3. Comment [tipId, createdAt] (중간 우선순위)
- **쿼리**: `comment.findMany({ where: { tipId }, orderBy: { createdAt: "asc" } })`
- **문제**: tipId 인덱스만으로는 createdAt 정렬 시 추가 sort 필요
- **해결**: 기존 `@@index([tipId])`를 `@@index([tipId, createdAt])` 복합 인덱스로 교체

### 4. Category.topCategoryId (중간 우선순위)
- **쿼리**: 카테고리 목록에서 topCategory 관계 조회
- **문제**: FK 컬럼에 인덱스 없음
- **해결**: `@@index([topCategoryId])` 추가

### 5. Bookmark [userId, createdAt] (중간 우선순위)
- **쿼리**: `bookmark.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })`
- **문제**: PK(userId, tipId)는 createdAt 정렬을 커버하지 못함
- **해결**: `@@index([userId, createdAt])` 추가

### 6. Comment.authorId (낮은 우선순위)
- **쿼리**: 댓글 삭제 시 authorId 검증
- **해결**: `@@index([authorId])` 추가

### 7. Tip.viewCount (낮은 우선순위)
- **쿼리**: 인기 팁 정렬 시 `orderBy: { viewCount: "desc" }`
- **해결**: `@@index([status, viewCount])` 추가 (status 필터와 함께 사용되므로 복합 인덱스)

## 영향 범위

- `prisma/schema.prisma` — 인덱스 추가
- DB migration 생성 필요

## 주의사항

- 인덱스 추가는 쓰기 성능에 미미한 오버헤드 발생 (현재 규모에서 무시 가능)
- 기존 데이터에 대해 인덱스가 자동 생성됨
