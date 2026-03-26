# Tip/Project 렌더링 속도 최적화

## 배경
Tips(`/tips`)와 Projects(`/projects`) 목록 페이지가 느리게 렌더링됨.
캐시 전략 적용 전에, 구조적 문제를 먼저 해결.

## 문제 분석
1. **Tips/Projects 페이지가 전체 `"use client"` — 서버 prefetch 없음**
   - 페이지 로드 → JS 번들 다운로드 → tRPC 호출 → 렌더링 (3단계 waterfall)
   - 홈페이지는 RSC prefetch + HydrateClient를 사용하지만, 이 두 페이지는 미적용
2. **홈페이지 `force-dynamic` 불필요**
   - 매 요청마다 서버 렌더링을 강제하여 TTFB가 늘어남
   - ISR(`revalidate`)로 전환하면 정적 캐시 활용 가능

## 적용 범위
- A: `/tips`, `/projects` 페이지에 RSC prefetch + HydrateClient 적용
- D: 홈페이지 `force-dynamic` → `revalidate = 60` 전환

## 기술 접근
- 클라이언트 컴포넌트를 별도 파일로 분리 (`tips-content.tsx`, `projects-content.tsx`)
- `page.tsx`를 async Server Component로 전환, `prefetchInfinite` 사용
- `HydrateClient`로 dehydrated state를 클라이언트에 주입
- `revalidate = 60`으로 ISR 적용 (60초마다 재생성)

## 영향 파일
- `src/app/page.tsx`
- `src/app/tips/page.tsx` (RSC로 전환)
- `src/app/tips/tips-content.tsx` (신규 — 기존 클라이언트 로직 분리)
- `src/app/projects/page.tsx` (RSC로 전환)
- `src/app/projects/projects-content.tsx` (신규 — 기존 클라이언트 로직 분리)
