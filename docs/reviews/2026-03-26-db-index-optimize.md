# DB Index 최적화 리뷰

## 구현 내용

Prisma 스키마에 7개 인덱스를 추가하여 주요 쿼리 패턴의 성능을 개선.

## 추가된 인덱스

| 모델 | 인덱스 | 대상 쿼리 |
|------|--------|-----------|
| Like | `@@index([tipId])` | 팁 좋아요 수 count |
| ProjectLike | `@@index([projectId])` | 프로젝트 좋아요 수 count |
| Comment | `@@index([tipId, createdAt])` | 댓글 목록 조회 + 정렬 (기존 tipId 단일 인덱스 교체) |
| Comment | `@@index([authorId])` | 댓글 삭제 시 작성자 검증 |
| Category | `@@index([topCategoryId])` | 카테고리 계층 조회 FK |
| Bookmark | `@@index([userId, createdAt])` | 북마크 목록 페이징 + 정렬 |
| Tip | `@@index([status, viewCount])` | 인기순 정렬 (status 필터 포함) |

## 핵심 결정

- **Composite PK 보완**: Like(userId, tipId)과 ProjectLike(userId, projectId)의 PK는 첫 번째 컬럼 기준으로만 효율적이므로, 두 번째 컬럼 단독 조회를 위한 별도 인덱스 추가
- **복합 인덱스 활용**: Comment의 tipId 단일 인덱스를 [tipId, createdAt] 복합 인덱스로 교체하여 정렬까지 커버

## 변경된 파일

- `prisma/schema.prisma` — 인덱스 7개 추가

## 배포 시 참고

- `npx prisma db push` 또는 `npx prisma migrate dev`로 인덱스 적용 필요
- 기존 데이터에 대해 인덱스 빌드 시간 발생 (현재 데이터 규모에서 수 초 이내)
