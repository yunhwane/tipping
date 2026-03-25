# 카테고리 구조 개편 리뷰

## 구현 내용

TopCategory를 확장 가능한 구조로 개편하여 IT, Design 2개의 상위 카테고리와 각각의 하위 카테고리를 지원하도록 변경.

## 핵심 결정

1. **DB 기반 아이콘**: lucide 아이콘 이름을 DB `icon` 필드에 저장, `DynamicIcon` 컴포넌트로 동적 렌더링
2. **sortOrder 기반 정렬**: TopCategory/Category 모두 `sortOrder` 필드로 순서 제어
3. **해시 기반 색상**: TipCard에서 카테고리 slug의 해시값으로 색상 자동 결정 (하드코딩 제거)
4. **2단 UI**: CategoryNav는 TopCategory 탭 + 하위 카테고리 필터, TipForm은 분야 → 카테고리 2단 셀렉트

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `prisma/schema.prisma` | TopCategory/Category에 icon, sortOrder 필드 추가 |
| `prisma/migrations/20260325000000_*` | 마이그레이션 SQL |
| `prisma/seed.ts` | IT + Design 상위 카테고리, 하위 카테고리 재구성 |
| `src/server/api/routers/category.ts` | getTopCategories API 추가, getAll 정렬 개선 |
| `src/components/dynamic-icon.tsx` | 동적 lucide 아이콘 렌더링 컴포넌트 (신규) |
| `src/components/category-nav.tsx` | TopCategory 탭 + 하위 카테고리 2단 구조 |
| `src/components/tip-form.tsx` | 분야 → 카테고리 2단 셀렉트 |
| `src/components/tip-card.tsx` | 하드코딩 카테고리 스타일 → 해시 기반 동적 색상 |

## 확장성

- 새 TopCategory(기획, 생활, 요리 등) 추가: DB에 row 추가만으로 UI 자동 반영
- 새 Category 추가: 해당 TopCategory 하위에 row 추가만으로 완료
- 아이콘 변경: DB icon 필드만 수정
- 순서 변경: sortOrder 값만 수정

## 알려진 제한

- `DynamicIcon`이 lucide-react의 `icons` 전체를 import하므로 tree-shaking 불가 (번들 사이즈 트레이드오프)
- 마이그레이션은 수동 생성 (로컬 DB 환경 없음) — 배포 시 `prisma migrate deploy`로 적용 필요
