# Review: Tip/Project 렌더링 속도 최적화

## 구현 내용

### D. 홈페이지 `force-dynamic` 제거
- `export const dynamic = "force-dynamic"` → `export const revalidate = 60`
- ISR로 전환하여 60초 동안 정적 페이지 제공, 이후 백그라운드 재생성

### A. Tips/Projects RSC prefetch 적용
- `page.tsx`를 async RSC로 전환, `prefetchInfinite`로 첫 페이지 서버 prefetch
- 기존 클라이언트 로직을 `tips-content.tsx`, `projects-content.tsx`로 분리
- `HydrateClient`로 dehydrated state 주입 → 클라이언트에서 재요청 없이 즉시 렌더링

## 주요 결정
- `pages: 1`로 첫 페이지만 prefetch (추가 페이지는 클라이언트에서 on-demand)
- `revalidate = 60` 적용하여 ISR 활용 (Tips/Projects 페이지도 동일)

## 변경 파일
| 파일 | 변경 |
|------|------|
| `src/app/page.tsx` | `force-dynamic` → `revalidate = 60` |
| `src/app/tips/page.tsx` | RSC prefetch + HydrateClient |
| `src/app/tips/tips-content.tsx` | 신규 (클라이언트 컴포넌트 분리) |
| `src/app/projects/page.tsx` | RSC prefetch + HydrateClient |
| `src/app/projects/projects-content.tsx` | 신규 (클라이언트 컴포넌트 분리) |

## 알려진 제한
- Tips 페이지의 `?sort=popular` URL 파라미터로 진입 시, prefetch는 `latest` 기준 → 인기순 전환 시 클라이언트 재요청 발생 (첫 번째 정렬 기준만 prefetch)
- 검색(`?q=...`) 진입 시 prefetch 데이터가 사용되지 않음 (검색은 별도 쿼리)
