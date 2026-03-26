# 카테고리 관리 기능 리뷰

## 구현 내용
관리자 페이지에서 TopCategory와 Category를 CRUD 관리할 수 있는 기능 추가.

## 주요 결정
- 아코디언 UI로 2계층 카테고리를 한 화면에서 관리
- Dialog(모달)로 생성/수정 폼 처리
- 삭제 제약: 하위 카테고리가 있는 TopCategory, 팁이 있는 Category는 삭제 불가
- 정렬은 sortOrder 숫자 입력 방식 (드래그앤드롭 미적용)
- adminProcedure 사용으로 관리자만 접근 가능

## 변경 파일
- `src/server/api/routers/admin.ts` — 카테고리 CRUD 프로시저 7개 추가
- `src/app/admin/categories/page.tsx` — 신규 카테고리 관리 페이지
- `src/app/admin/layout.tsx` — 사이드바에 카테고리 관리 메뉴 추가

## 추가된 tRPC 프로시저
| 프로시저 | 타입 | 설명 |
|----------|------|------|
| getCategories | query | 전체 카테고리 계층 조회 (팁 수 포함) |
| createTopCategory | mutation | 상위 카테고리 생성 |
| updateTopCategory | mutation | 상위 카테고리 수정 |
| deleteTopCategory | mutation | 상위 카테고리 삭제 (하위 없을 때만) |
| createCategory | mutation | 하위 카테고리 생성 |
| updateCategory | mutation | 하위 카테고리 수정 |
| deleteCategory | mutation | 하위 카테고리 삭제 (팁 없을 때만) |

## 알려진 제한사항
- 드래그앤드롭 정렬 미지원 (sortOrder 수동 입력)
- slug 중복 체크는 DB unique 제약조건에 의존 (프론트 사전 체크 없음)
