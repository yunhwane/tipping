# SSR Prefetch 및 페이지 로딩 속도 최적화

## 배경

[참고 아티클](https://coggiee.medium.com/nextjs-tanstack-query-supabase-페이지-로딩-속도-up-a34e5de978b7)을 기반으로 현재 프로젝트의 페이지 로딩 속도를 개선한다.

현재 상태:
- **홈(`/`)**, **팁 목록(`/tips`)**, **프로젝트 목록(`/projects`)** 페이지는 이미 SSR prefetch가 적용되어 있음
- **팁 상세(`/tips/[id]`)**, **카테고리(`/category/[slug]`)**, **태그(`/tag/[name]`)**, **프로젝트 상세(`/projects/[id]`)** 페이지는 전체가 `"use client"`로 되어 있어 CSR로만 동작
- Vercel 리전이 설정되지 않아 기본값(Washington D.C.)으로 배포됨

## 요구사항

### 1. Vercel 리전 설정 (icn1 — 서울)
- `vercel.json`에 `"regions": ["icn1"]` 추가
- Serverless Function이 서울 리전에서 실행되어 한국 사용자의 latency 감소

### 2. 팁 상세 페이지 SSR Prefetch (`/tips/[id]`)
- 현재: 전체가 클라이언트 컴포넌트, 모든 데이터가 CSR로 로딩
- 개선: 서버 컴포넌트 wrapper에서 `tip.getById` prefetch
  - 댓글(`comment.getByTipId`), 좋아요 수(`like.getCount`)도 함께 prefetch (병렬)
  - 기존 클라이언트 컴포넌트는 별도 파일로 분리 (`tip-detail-content.tsx`)

### 3. 프로젝트 상세 페이지 SSR Prefetch (`/projects/[id]`)
- 현재: 전체가 클라이언트 컴포넌트
- 개선: 서버 컴포넌트 wrapper에서 `project.getById` prefetch
  - 기존 클라이언트 컴포넌트는 별도 파일로 분리 (`project-detail-content.tsx`)

### 4. 카테고리 페이지 SSR Prefetch (`/category/[slug]`)
- 현재: 전체가 클라이언트 컴포넌트
- 개선: 서버 컴포넌트 wrapper에서 `category.getBySlug` + `tip.getAll` prefetchInfinite 병렬 실행
  - 기존 클라이언트 컴포넌트는 별도 파일로 분리 (`category-content.tsx`)

### 5. 태그 페이지 SSR Prefetch (`/tag/[name]`)
- 현재: 전체가 클라이언트 컴포넌트
- 개선: 서버 컴포넌트 wrapper에서 `tip.getAll` prefetchInfinite 실행
  - 기존 클라이언트 컴포넌트는 별도 파일로 분리 (`tag-content.tsx`)

## Scope

### In-Scope
- Vercel 리전 설정
- 4개 페이지 SSR prefetch 적용
- 클라이언트/서버 컴포넌트 분리

### Out-of-Scope
- DB 인덱스 최적화 (Supabase/Prisma 레벨)
- useSuspenseQuery 도입 (현재 프로젝트에서 사용하지 않음)
- Nested component waterfall 해소 (현재 like/bookmark/comment는 tipId를 이미 알고 있으므로 SSR prefetch로 해결)

## 기술 접근

기존 프로젝트의 패턴(`src/app/page.tsx`, `src/app/tips/page.tsx`)을 따라:
1. `page.tsx`를 async 서버 컴포넌트로 변환
2. `api.xxx.prefetch()` 또는 직접 호출로 데이터 프리패치
3. `<HydrateClient>`로 감싸서 클라이언트에 캐시 전달
4. 클라이언트 컴포넌트에서 동일한 쿼리 키로 `useQuery` 호출 시 캐시 히트

## 영향 파일

- `vercel.json` — 리전 추가
- `src/app/tips/[id]/page.tsx` — 서버 컴포넌트로 변환
- `src/app/tips/[id]/tip-detail-content.tsx` — 기존 클라이언트 로직 이동 (신규)
- `src/app/projects/[id]/page.tsx` — 서버 컴포넌트로 변환
- `src/app/projects/[id]/project-detail-content.tsx` — 기존 클라이언트 로직 이동 (신규)
- `src/app/category/[slug]/page.tsx` — 서버 컴포넌트로 변환
- `src/app/category/[slug]/category-content.tsx` — 기존 클라이언트 로직 이동 (신규)
- `src/app/tag/[name]/page.tsx` — 서버 컴포넌트로 변환
- `src/app/tag/[name]/tag-content.tsx` — 기존 클라이언트 로직 이동 (신규)
