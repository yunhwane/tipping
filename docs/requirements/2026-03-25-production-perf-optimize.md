# Production 성능 최적화

## 배경

프로덕션 환경에서 체감 속도가 느린 문제를 코드 분석을 통해 확인.
서버-클라이언트 렌더링 전략, 이미지 최적화, 캐싱, 불필요한 런타임 오버헤드 등 여러 병목이 복합적으로 작용.

## 개선 항목

### 1. 메인 페이지 Server Component 전환 (HIGH)
- **현재**: `page.tsx`가 `"use client"`로 선언되어 CSR 방식
- **문제**: 초기 HTML이 빈 상태로 전달되어 FCP/LCP 지연, 클라이언트에서 2개 tRPC 쿼리 발사
- **개선**: Server Component로 전환 + `HydrateClient` 패턴으로 서버에서 데이터 prefetch
- **영향 파일**: `src/app/page.tsx`

### 2. next/image 전환 (HIGH)
- **현재**: `project-card.tsx`에서 raw `<img>` 태그 사용
- **문제**: 이미지 최적화(WebP, lazy loading, responsive srcset) 미적용
- **개선**: `next/image` 컴포넌트로 교체 + `next.config.ts`에 이미지 도메인 설정
- **영향 파일**: `src/components/project-card.tsx`, `next.config.ts`

### 3. tRPC 타이밍 미들웨어 정리 (MEDIUM)
- **현재**: 모든 요청마다 `console.log` 실행 (프로덕션 포함)
- **문제**: Node.js `console.log`는 동기 I/O, 요청 누적 시 오버헤드
- **개선**: 프로덕션에서 로깅 비활성화 (dev 환경만 동작)
- **영향 파일**: `src/server/api/trpc.ts`

### 4. React Query staleTime 최적화 (MEDIUM)
- **현재**: 전역 staleTime 30초
- **문제**: 카테고리/태그 등 거의 변하지 않는 데이터도 30초마다 refetch
- **개선**: staleTime을 60초로 조정 (개별 쿼리에서 더 긴 시간 설정 가능)
- **영향 파일**: `src/trpc/query-client.ts`

### 5. 댓글 페이지네이션 추가 (MEDIUM)
- **현재**: 팁의 모든 댓글을 limit 없이 조회
- **문제**: 댓글 수가 많아지면 응답/렌더링 비용 급증
- **개선**: `take` 파라미터 추가로 초기 로딩 제한 + 더보기 패턴
- **영향 파일**: `src/server/api/routers/comment.ts`, `src/components/comment-section.tsx`

### 6. 폰트 로딩 최적화 (LOW)
- **현재**: Geist 폰트에 `display` 옵션 미설정
- **문제**: 폰트 다운로드 완료까지 텍스트 미표시(FOIT)
- **개선**: `display: "swap"` 추가
- **영향 파일**: `src/app/layout.tsx`

## 범위 외 (이번 PR에서 제외)

- DB 복합 인덱스: 확인 결과 이미 `@@index([status, createdAt])` 등 주요 인덱스 존재
- React.memo 추가: 현재 카드 컴포넌트 수가 적어 체감 효과 미미
- Admin 대시보드 쿼리 최적화: 별도 PR로 분리

## 기술적 접근

- Server Component 전환 시 기존 `src/trpc/server.ts`의 `HydrateClient` + `api` caller 활용
- `next/image`는 외부 이미지 URL을 위해 `remotePatterns` 설정 필요
- 댓글 페이지네이션은 cursor 기반이 아닌 단순 limit/offset (댓글은 순서 고정)
