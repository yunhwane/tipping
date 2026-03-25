# 카테고리 구조 개편

## 배경

현재 TopCategory가 "IT/개발" 1개뿐이라 사실상 1단 구조로 동작하고 있다.
향후 생활, 요리 등 다양한 도메인 확장을 고려하여 TopCategory를 동적으로 관리할 수 있도록 개편한다.

## MVP 범위

**TopCategory 2개:**

| TopCategory | slug | 하위 카테고리 |
|---|---|---|
| IT | it | Frontend, Backend, DevOps, Database, Mobile, AI/ML, 기타 |
| Design | design | UI/UX, Graphic, Product Design |

> 기획 카테고리는 MVP 이후 추가 예정

## 요구사항

### 1. 스키마 변경
- `TopCategory`에 `icon`(String, optional), `sortOrder`(Int, default 0) 필드 추가
- `Category`에 `sortOrder`(Int, default 0) 필드 추가
- 확장성: 새 TopCategory/Category를 DB에 추가하는 것만으로 UI에 자동 반영

### 2. API 변경
- `category.getAll` → TopCategory 포함 조회, sortOrder 기준 정렬
- `category.getTopCategories` 추가 — TopCategory 목록 + 하위 카테고리 수 포함

### 3. UI 변경
- **CategoryNav**: TopCategory 탭 → 하위 카테고리 필터 2단 구조
  - 하드코딩된 아이콘 매핑 제거, DB icon 필드 기반으로 변경
- **TipForm**: TopCategory 선택 → Category 선택 2단 드롭다운
- **카테고리 페이지**: 기존 `/category/[slug]` 유지

### 4. 시드 데이터
- 기존 IT/개발 TopCategory → slug을 `it`으로 변경
- Design TopCategory 및 하위 카테고리 3개 추가
- 기존 팁 시드 데이터는 IT 하위 카테고리에 유지

## 영향 파일

- `prisma/schema.prisma` — 스키마 변경
- `prisma/seed.ts` — 시드 데이터 재구성
- `src/server/api/routers/category.ts` — API 추가/수정
- `src/components/category-nav.tsx` — 2단 네비게이션
- `src/components/tip-form.tsx` — 2단 카테고리 선택
- `src/app/tips/page.tsx`, `src/app/page.tsx` — 필요시 수정

## 기술 접근

- Prisma migration으로 스키마 변경 (icon, sortOrder 추가)
- 아이콘은 lucide 아이콘 이름을 문자열로 저장, 클라이언트에서 동적 렌더링
- TopCategory sortOrder → Category sortOrder 순으로 정렬하여 순서 보장
