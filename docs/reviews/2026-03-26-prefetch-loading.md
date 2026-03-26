# SSR Prefetch 및 페이지 로딩 속도 최적화 — 리뷰

## 구현 요약

아티클(coggiee.medium.com)에서 제시한 최적화 기법을 프로젝트의 tRPC 아키텍처에 맞게 적용했다.

## 변경 사항

### 1. Vercel 리전 설정
- `vercel.json`에 `"regions": ["icn1"]` 추가
- Serverless Function 실행 위치를 서울로 변경

### 2. 팁 상세 페이지 (`/tips/[id]`)
- `page.tsx` → async 서버 컴포넌트로 변환
- 기존 클라이언트 로직 → `tip-detail-content.tsx`로 분리
- SSR에서 `tip.getById`, `like.getCount`, `comment.getByTipId`를 `Promise.all`로 병렬 prefetch
- Nested component waterfall 해소: 기존에 LikeButton, CommentSection이 마운트 후 개별 fetch하던 패턴을 서버에서 사전에 모두 prefetch

### 3. 프로젝트 상세 페이지 (`/projects/[id]`)
- `page.tsx` → async 서버 컴포넌트로 변환
- 기존 클라이언트 로직 → `project-detail-content.tsx`로 분리
- SSR에서 `project.getById` prefetch

### 4. 카테고리 페이지 (`/category/[slug]`)
- `page.tsx` → async 서버 컴포넌트로 변환
- 기존 클라이언트 로직 → `category-content.tsx`로 분리
- SSR에서 `category.getBySlug`, `tip.getAll` (infinite)를 `Promise.all`로 병렬 prefetch

### 5. 태그 페이지 (`/tag/[name]`)
- `page.tsx` → async 서버 컴포넌트로 변환
- 기존 클라이언트 로직 → `tag-content.tsx`로 분리
- SSR에서 `tip.getAll` (infinite) prefetch

## 주요 결정

- **prefetch 대상 선정**: `like.getStatus`, `bookmark.getStatus`는 인증 상태에 따라 `enabled` 조건으로 제어되므로 SSR prefetch에서 제외. `like.getCount`는 비인증 사용자도 볼 수 있으므로 prefetch 대상에 포함.
- **에러 핸들링**: 기존 프로젝트 패턴과 동일하게 `.catch(() => {})`로 prefetch 실패 시 graceful degradation (클라이언트에서 다시 fetch)
- **params 전달**: Next.js 15에서 `params`가 `Promise`로 변경되어 `await params`로 처리

## 변경 파일

| 파일 | 변경 유형 |
|------|-----------|
| `vercel.json` | 수정 — regions 추가 |
| `src/app/tips/[id]/page.tsx` | 수정 — 서버 컴포넌트 wrapper |
| `src/app/tips/[id]/tip-detail-content.tsx` | 신규 — 클라이언트 컴포넌트 분리 |
| `src/app/projects/[id]/page.tsx` | 수정 — 서버 컴포넌트 wrapper |
| `src/app/projects/[id]/project-detail-content.tsx` | 신규 — 클라이언트 컴포넌트 분리 |
| `src/app/category/[slug]/page.tsx` | 수정 — 서버 컴포넌트 wrapper |
| `src/app/category/[slug]/category-content.tsx` | 신규 — 클라이언트 컴포넌트 분리 |
| `src/app/tag/[name]/page.tsx` | 수정 — 서버 컴포넌트 wrapper |
| `src/app/tag/[name]/tag-content.tsx` | 신규 — 클라이언트 컴포넌트 분리 |
| `docs/requirements/2026-03-26-prefetch-loading.md` | 신규 — 요구사항 문서 |

## 알려진 제한사항

- 로컬 환경변수 미설정으로 `npm run build`가 로컬에서 실패 (CI/Vercel에서는 정상)
- `npm run typecheck`의 기존 에러들(admin 페이지 등)은 이 PR 범위 밖
