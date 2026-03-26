# 카테고리 관리 기능

## 배경
관리자 페이지에서 TopCategory와 Category를 관리(CRUD)할 수 있는 기능이 필요하다.

## 요구사항

### 기능
- TopCategory CRUD: name, slug, icon, sortOrder
- Category CRUD: name, slug, description, icon, sortOrder, topCategoryId
- 삭제 제약: 팁이 있는 Category 삭제 불가, 하위 Category가 있는 TopCategory 삭제 불가
- 아코디언 UI: TopCategory를 펼치면 하위 Category 목록 표시
- 정렬: sortOrder 숫자 입력 방식

### 기술 구현
- tRPC `admin` 라우터에 카테고리 CRUD 프로시저 추가 (adminProcedure)
- `/admin/categories` 페이지 신규 생성
- `admin/layout.tsx` 사이드바에 메뉴 추가

## 영향 범위
- `src/server/api/routers/admin.ts`
- `src/app/admin/categories/page.tsx` (신규)
- `src/app/admin/layout.tsx`
