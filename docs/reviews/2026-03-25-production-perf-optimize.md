# Review: Production 성능 최적화

## 구현 내용

### 1. 메인 페이지 Server Component 전환
- `src/app/page.tsx`에서 `"use client"` 제거, async Server Component로 전환
- 서버에서 `api.tip.getPopular`, `api.tip.getAll`을 prefetch
- `HydrateClient`로 감싸서 클라이언트 React Query 캐시에 자동 주입
- 인터랙티브 섹션은 `src/components/home-sections.tsx`로 분리 (Client Component)

### 2. next/image 전환
- `src/components/project-card.tsx`: raw `<img>` → `next/image` Image 컴포넌트
- `fill` + `sizes` prop으로 반응형 이미지 최적화
- `next.config.ts`: `images.remotePatterns`에 https 와일드카드 설정

### 3. tRPC 타이밍 미들웨어 정리
- `src/server/api/trpc.ts`: `console.log`를 `isDev` 조건 내부로 이동
- 프로덕션에서 불필요한 동기 I/O 제거

### 4. React Query staleTime 조정
- `src/trpc/query-client.ts`: 30초 → 60초
- 불필요한 refetch 빈도 절반으로 감소

### 5. 댓글 커서 기반 페이지네이션
- `src/server/api/routers/comment.ts`: `getByTipId`에 `limit`/`cursor` 파라미터 추가
- `src/components/comment-section.tsx`: `useInfiniteQuery` + "댓글 더보기" 버튼 패턴
- 초기 로딩 20개로 제한

### 6. 폰트 display: swap
- `src/app/layout.tsx`: Geist 폰트에 `display: "swap"` 추가
- FOIT → FOUT 전환으로 텍스트 즉시 표시

## 변경 파일
- `next.config.ts` — 이미지 최적화 설정
- `src/app/page.tsx` — Server Component 전환
- `src/app/layout.tsx` — 폰트 display swap
- `src/components/home-sections.tsx` — 신규 (메인 페이지 클라이언트 섹션)
- `src/components/project-card.tsx` — next/image 전환
- `src/components/comment-section.tsx` — 페이지네이션
- `src/server/api/routers/comment.ts` — 커서 기반 페이지네이션 API
- `src/server/api/trpc.ts` — 프로덕션 로깅 제거
- `src/trpc/query-client.ts` — staleTime 조정

## 알려진 제한사항
- `next.config.ts`의 `remotePatterns`이 모든 https 도메인 허용 — 필요 시 특정 도메인으로 제한 가능
- 기존에 `getByTipId`를 `useQuery`로 쓰던 곳이 있으면 `useInfiniteQuery`로 변경 필요
